import csv
import argparse
import unicodedata
import time
import re
from pathlib import Path
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

BASE = "https://www.victaulic.com"
SITEMAP_URL = "https://www.victaulic.com/vtc_products-sitemap.xml"
OUT_CSV = "victaulic_fire_protection_products.csv"

# Be polite + identifiable
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FireProductsCSVBot/1.0; +local-script)"
}

REQUEST_DELAY_SEC = 0.6  # adjust up if you want to be extra gentle
DEFAULT_RETRIES = 4
DEFAULT_BACKOFF_SEC = 8.0

CSV_FIELDS = [
    "sku",
    "product_name",
    "category",
    "size_range",
    "short_description",
    "product_url",
]


def clean_text(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = re.sub(r"\s+", " ", s.strip())
    return s


def get_soup(
    session: requests.Session,
    url: str,
    timeout: int,
    retries: int,
    backoff_sec: float,
) -> BeautifulSoup:
    for attempt in range(retries + 1):
        resp = session.get(url, headers=HEADERS, timeout=timeout)
        if resp.status_code == 429 and attempt < retries:
            retry_after = resp.headers.get("Retry-After")
            wait_sec = float(retry_after) if retry_after and retry_after.isdigit() else backoff_sec * (attempt + 1)
            print(f"RATE LIMITED: waiting {wait_sec:.1f}s before retrying {url}")
            time.sleep(wait_sec)
            continue

        resp.raise_for_status()
        return BeautifulSoup(resp.content, "lxml")

    raise RuntimeError(f"Unable to fetch after {retries + 1} attempts: {url}")


def get_robots_parser(session: requests.Session, timeout: int) -> RobotFileParser:
    robots_url = urljoin(BASE, "/robots.txt")
    rp = RobotFileParser()
    # RobotFileParser can't use requests directly, so we fetch manually
    try:
        r = session.get(robots_url, headers=HEADERS, timeout=timeout)
        if r.status_code == 200:
            rp.parse(r.text.splitlines())
        else:
            # If robots can't be fetched, we default to allowing (common approach),
            # but you can flip this if you want strict behavior.
            rp.parse(["User-agent: *", "Allow: /"])
    except Exception:
        # Parse a permissive robots.txt to allow all
        rp.parse(["User-agent: *", "Allow: /"])
    return rp


def can_fetch(rp: RobotFileParser, url: str) -> bool:
    try:
        return rp.can_fetch(HEADERS["User-Agent"], url)
    except Exception:
        return True


def extract_short_description(soup: BeautifulSoup) -> str:
    # Prefer meta descriptions
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        return clean_text(meta["content"])

    og = soup.find("meta", attrs={"property": "og:description"})
    if og and og.get("content"):
        return clean_text(og["content"])

    # Fallback: first paragraph after H1
    h1 = soup.find("h1")
    if h1:
        p = h1.find_next("p")
        if p:
            return clean_text(p.get_text(" ", strip=True))

    # Fallback: first visible paragraph on page
    p = soup.find("p")
    if p:
        return clean_text(p.get_text(" ", strip=True))

    return ""


def extract_title(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1:
        return clean_text(h1.get_text(" ", strip=True))
    if soup.title:
        return clean_text(soup.title.get_text(" ", strip=True))
    return ""


def extract_sku(soup: BeautifulSoup, title: str) -> str:
    """Extract SKU/Model number from the page"""
    # Try to find model number in various places

    # Look for "Style XXX" or "Series XXX" in the title
    style_match = re.search(r'(?:Style|Series)\s+([A-Z0-9]+[A-Z0-9\-]*)', title, re.IGNORECASE)
    if style_match:
        return style_match.group(1)

    # Look for model number patterns (e.g., V2815, 769N, 08.14)
    model_match = re.search(r'\b([A-Z]{1,2}\d{2,4}[A-Z]?|[A-Z]?\d{2,4}[A-Z]{1,2}|\d{2}\.\d{2})\b', title)
    if model_match:
        return model_match.group(1)

    # Look in meta tags or structured data
    meta_sku = soup.find("meta", attrs={"property": "product:retailer_item_id"})
    if meta_sku and meta_sku.get("content"):
        return clean_text(meta_sku["content"])

    return ""


def extract_size_range(soup: BeautifulSoup) -> str:
    """Extract available sizes from the page"""
    text = soup.get_text()

    # Common patterns for size ranges
    # Example: "Sizes from 4 - 6"" | DN100 - DN150"
    # Example: "2 - 12"" | DN50 - DN300"
    size_patterns = [
        r'Sizes?\s+(?:from|available|range)\s+([0-9/\-\" ]+(?:\||to)[^\n.]+)',
        r'(?:Size|Available|Range)[:\s]+([0-9/\-\" ]+(?:DN|inch|mm)[^\n.]+)',
        r'([0-9/]+\s*[-–]\s*[0-9/]+\s*["\']?\s*\|\s*DN[0-9]+\s*[-–]\s*DN[0-9]+)',
    ]

    for pattern in size_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            size_text = clean_text(match.group(1))
            # Clean up common artifacts
            size_text = size_text.replace('|', '|').strip()
            return size_text[:100]  # Limit length

    return ""


def extract_category(soup: BeautifulSoup) -> str:
    """Extract product category"""
    # Try breadcrumbs
    breadcrumb = soup.find("nav", class_=re.compile("breadcrumb", re.I))
    if breadcrumb:
        items = breadcrumb.find_all("a")
        if len(items) > 1:
            # Get the last meaningful breadcrumb (skip home)
            categories = [clean_text(item.get_text()) for item in items if clean_text(item.get_text()).lower() not in ('home', 'products')]
            if categories:
                return " > ".join(categories[-2:]) if len(categories) > 1 else categories[-1]

    # Look for category in meta tags
    meta_cat = soup.find("meta", attrs={"property": "article:section"})
    if meta_cat and meta_cat.get("content"):
        return clean_text(meta_cat["content"])

    # Infer from title
    title = extract_title(soup).lower()
    if any(word in title for word in ['valve', 'check']):
        return "Valves"
    elif any(word in title for word in ['sprinkler', 'nozzle']):
        return "Sprinklers"
    elif any(word in title for word in ['coupling', 'joint']):
        return "Couplings"
    elif any(word in title for word in ['fitting', 'elbow', 'tee']):
        return "Fittings"

    return "Fire Protection"


def get_all_product_urls_from_sitemap(session: requests.Session, timeout: int) -> list:
    """Fetch all product URLs from the sitemap.xml"""
    print(f"Fetching sitemap from {SITEMAP_URL}...")
    resp = session.get(SITEMAP_URL, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()

    # Parse XML sitemap
    root = ET.fromstring(resp.content)
    # XML namespace handling
    ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    urls = []
    for url_elem in root.findall("ns:url", ns):
        loc = url_elem.find("ns:loc", ns)
        if loc is not None and loc.text:
            urls.append(loc.text.strip())

    return sorted(set(urls))


def is_fire_protection_product(soup: BeautifulSoup) -> bool:
    """Check if a product is fire-protection related"""
    text = soup.get_text().lower()

    # Fire-related keywords
    fire_keywords = [
        "fire", "sprinkler", "firelock", "flame", "suppression",
        "extinguish", "nfpa", "ul listed", "fm approved"
    ]

    # Check product name/title
    title = extract_title(soup).lower()
    for keyword in fire_keywords:
        if keyword in title:
            return True

    # Check page content
    for keyword in fire_keywords:
        if keyword in text:
            return True

    return False


def dedupe_and_sort_rows(rows: list[dict]) -> list[dict]:
    """Keep one row per URL and write rows in stable catalog order."""
    by_url = {}
    for row in rows:
        product_url = row.get("product_url", "")
        if product_url and product_url not in by_url:
            by_url[product_url] = row

    return sorted(
        by_url.values(),
        key=lambda r: (
            clean_text(r.get("category", "")).casefold(),
            clean_text(r.get("product_name", "")).casefold(),
            clean_text(r.get("sku", "")).casefold(),
            clean_text(r.get("product_url", "")).casefold(),
        ),
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Scrape Victaulic fire protection products into a stable CSV."
    )
    parser.add_argument("--max-pages", type=int, default=None, help="Limit product pages scanned.")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY_SEC, help="Delay between product requests.")
    parser.add_argument("--timeout", type=int, default=30, help="HTTP request timeout in seconds.")
    parser.add_argument("--retries", type=int, default=DEFAULT_RETRIES, help="Retries for rate-limited product pages.")
    parser.add_argument("--backoff", type=float, default=DEFAULT_BACKOFF_SEC, help="Base seconds to wait after a 429.")
    parser.add_argument("--allow-partial", action="store_true", help="Write CSV even if some product pages fail.")
    parser.add_argument("--output", default=OUT_CSV, help="Output CSV path.")
    args = parser.parse_args()

    if args.max_pages is not None and args.output == OUT_CSV:
        parser.error("--max-pages is for sample runs; pass --output C:\\tmp\\victaulic_sample.csv")

    return args


def main():
    args = parse_args()
    session = requests.Session()
    rp = get_robots_parser(session, args.timeout)

    # 1) Get all product URLs from sitemap
    all_product_urls = get_all_product_urls_from_sitemap(session, args.timeout)
    if args.max_pages is not None:
        all_product_urls = all_product_urls[:args.max_pages]
    print(f"Found {len(all_product_urls)} total products in sitemap")

    # 2) Visit each product page and extract fire-protection products
    rows = []
    failed_urls = []
    fire_product_count = 0

    for i, pu in enumerate(all_product_urls, start=1):
        if not can_fetch(rp, pu):
            print(f"ROBOTS BLOCKED (skipping product): {pu}")
            continue

        try:
            soup = get_soup(session, pu, args.timeout, args.retries, args.backoff)

            # Check if it's a fire protection product
            if is_fire_protection_product(soup):
                fire_product_count += 1
                name = extract_title(soup)
                desc = extract_short_description(soup)
                sku = extract_sku(soup, name)
                size_range = extract_size_range(soup)
                category = extract_category(soup)

                rows.append(
                    {
                        "sku": sku,
                        "product_name": name,
                        "category": category,
                        "size_range": size_range,
                        "short_description": desc,
                        "product_url": pu,
                    }
                )
                print(f"[{fire_product_count}] Found: {sku} - {name}")
        except Exception as e:
            print(f"FAILED product fetch: {pu} -> {e}")
            failed_urls.append(pu)

        if i % 50 == 0:
            print(f"...processed {i}/{len(all_product_urls)} total products ({fire_product_count} fire-related)")

        time.sleep(args.delay)

    if failed_urls and not args.allow_partial:
        print("\nSCRAPE INCOMPLETE. CSV was not written because product pages failed:")
        for failed_url in failed_urls:
            print(f"  - {failed_url}")
        print("\nRe-run with a larger --delay/--backoff, or pass --allow-partial for diagnostics only.")
        raise SystemExit(1)

    # 3) Write CSV
    rows = dedupe_and_sort_rows(rows)
    output_path = Path(args.output)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=CSV_FIELDS,
            lineterminator="\n",
        )
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"\nDONE. Wrote {len(rows)} fire protection products to: {output_path}")
    print(f"Total products scanned: {len(all_product_urls)}")
    if failed_urls:
        print(f"WARNING: {len(failed_urls)} product pages failed; output is partial.")


if __name__ == "__main__":
    main()
