import csv
import time
import re
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


def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    return s


def get_soup(session: requests.Session, url: str) -> BeautifulSoup:
    resp = session.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "lxml")


def get_robots_parser(session: requests.Session) -> RobotFileParser:
    robots_url = urljoin(BASE, "/robots.txt")
    rp = RobotFileParser()
    # RobotFileParser can't use requests directly, so we fetch manually
    try:
        r = session.get(robots_url, headers=HEADERS, timeout=30)
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


def get_all_product_urls_from_sitemap(session: requests.Session) -> list:
    """Fetch all product URLs from the sitemap.xml"""
    print(f"Fetching sitemap from {SITEMAP_URL}...")
    resp = session.get(SITEMAP_URL, headers=HEADERS, timeout=30)
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

    return urls


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


def main():
    session = requests.Session()
    rp = get_robots_parser(session)

    # 1) Get all product URLs from sitemap
    all_product_urls = get_all_product_urls_from_sitemap(session)
    print(f"Found {len(all_product_urls)} total products in sitemap")

    # 2) Visit each product page and extract fire-protection products
    rows = []
    fire_product_count = 0

    for i, pu in enumerate(all_product_urls, start=1):
        if not can_fetch(rp, pu):
            print(f"ROBOTS BLOCKED (skipping product): {pu}")
            continue

        try:
            soup = get_soup(session, pu)

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

        if i % 50 == 0:
            print(f"...processed {i}/{len(all_product_urls)} total products ({fire_product_count} fire-related)")

        time.sleep(REQUEST_DELAY_SEC)

    # 3) Write CSV
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["sku", "product_name", "category", "size_range", "short_description", "product_url"],
        )
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"\nDONE. Wrote {len(rows)} fire protection products to: {OUT_CSV}")
    print(f"Total products scanned: {len(all_product_urls)}")


if __name__ == "__main__":
    main()
