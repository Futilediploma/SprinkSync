import csv
import re
from typing import List, Dict, Optional
from difflib import get_close_matches


class MaterialListBuilder:
    def __init__(self, product_database_csv: str):
        """Load the product database from CSV"""
        self.products = []
        with open(product_database_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Ensure all expected fields exist (backwards compatibility)
                product = {
                    "sku": row.get("sku", ""),
                    "product_name": row.get("product_name", ""),
                    "category": row.get("category", ""),
                    "size_range": row.get("size_range", ""),
                    "short_description": row.get("short_description", ""),
                    "product_url": row.get("product_url", ""),
                }
                self.products.append(product)

        # Create lookup indexes for faster searching
        self.sku_index = {p["sku"].upper(): p for p in self.products if p["sku"]}
        self.name_index = {p["product_name"].upper(): p for p in self.products}

    def parse_input_line(self, line: str) -> Optional[Dict]:
        """
        Parse input like:
        - "qty 1, 6" 769N preaction valve"
        - "2x 4" style 232 coupling"
        - "5, 2 inch, series 721 ball valve"

        Returns dict with: qty, size, search_text
        """
        line = line.strip()
        if not line:
            return None

        # Pattern 1: qty X, size"Y" rest_of_text
        # Pattern 2: Xx size"Y" rest_of_text
        # Pattern 3: qty X, Y", rest_of_text
        # Pattern 4: qty X, Y inch, rest_of_text

        qty = 1
        size = ""
        search_text = line

        # Extract quantity (qty X or Xx or just X)
        qty_patterns = [
            r'^(?:qty\s*)?(\d+)\s*[x,]\s*',  # qty 1, or 1x or 1,
            r'^(\d+)\s+',  # just number followed by space
        ]

        for pattern in qty_patterns:
            match = re.match(pattern, search_text, re.IGNORECASE)
            if match:
                qty = int(match.group(1))
                search_text = search_text[match.end():].strip()
                break

        # Extract size (can be before or after qty removal)
        size_patterns = [
            r'^(\d+(?:/\d+)?)\s*["\']?\s*,?\s*',  # 6" or 6 or 4/6
            r'^(\d+)\s*inch\s*,?\s*',  # 6 inch
            r',\s*(\d+(?:/\d+)?)\s*["\']?\s*,?\s*',  # , 6"
            r',\s*(\d+)\s*inch\s*,?\s*',  # , 6 inch
        ]

        for pattern in size_patterns:
            match = re.search(pattern, search_text, re.IGNORECASE)
            if match:
                size = match.group(1) + '"'
                search_text = search_text[:match.start()] + search_text[match.end():]
                search_text = search_text.strip().lstrip(',').strip()
                break

        return {
            "qty": qty,
            "size": size,
            "search_text": search_text.strip(),
        }

    def find_product(self, search_text: str) -> Optional[Dict]:
        """
        Find product by SKU or name.
        Returns the product dict if found.
        """
        search_upper = search_text.upper()

        # Try exact SKU match first
        for sku, product in self.sku_index.items():
            if sku in search_upper:
                return product

        # Try exact name match
        if search_upper in self.name_index:
            return self.name_index[search_upper]

        # Try fuzzy match on product names
        all_names = list(self.name_index.keys())
        matches = get_close_matches(search_upper, all_names, n=1, cutoff=0.6)
        if matches:
            return self.name_index[matches[0]]

        # Try partial match on SKU or name
        for product in self.products:
            if product["sku"] and product["sku"].upper() in search_upper:
                return product

        # Try searching for key terms in product name
        search_words = set(search_upper.split())
        best_match = None
        best_score = 0

        for product in self.products:
            product_words = set(product["product_name"].upper().split())
            matching_words = search_words & product_words
            score = len(matching_words)

            if score > best_score and score >= 2:  # At least 2 words match
                best_score = score
                best_match = product

        return best_match

    def build_material_list(self, input_lines: List[str]) -> List[Dict]:
        """
        Build a material list from input lines.
        Returns list of material items with qty, size, product info.
        """
        materials = []

        for i, line in enumerate(input_lines, start=1):
            parsed = self.parse_input_line(line)
            if not parsed:
                continue

            product = self.find_product(parsed["search_text"])

            if product:
                materials.append({
                    "line_num": i,
                    "qty": parsed["qty"],
                    "size": parsed["size"],
                    "sku": product["sku"],
                    "product_name": product["product_name"],
                    "category": product["category"],
                    "size_range": product["size_range"],
                    "product_url": product["product_url"],
                    "matched": True,
                    "original_input": line.strip(),
                })
            else:
                # Couldn't find product
                materials.append({
                    "line_num": i,
                    "qty": parsed["qty"],
                    "size": parsed["size"],
                    "sku": "",
                    "product_name": parsed["search_text"],
                    "category": "",
                    "size_range": "",
                    "product_url": "",
                    "matched": False,
                    "original_input": line.strip(),
                })

        return materials

    def export_to_csv(self, materials: List[Dict], output_file: str):
        """Export material list to CSV"""
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            fieldnames = [
                "line_num", "qty", "size", "sku", "product_name",
                "category", "size_range", "product_url", "matched", "original_input"
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in materials:
                writer.writerow(item)


def main():
    """Example usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python material_list_builder.py <input_file.txt> [output.csv]")
        print("\nOr use interactively:")
        print("  python material_list_builder.py")
        print("\nExample input format:")
        print("  qty 1, 6\" 769N preaction valve")
        print("  2x 4\" style 232 coupling")
        print("  5, 2 inch, series 721 ball valve")
        return

    # Initialize with product database
    builder = MaterialListBuilder("victaulic_fire_protection_products.csv")

    # Interactive mode
    if len(sys.argv) == 1:
        print("\nMaterial List Builder - Interactive Mode")
        print("=" * 50)
        print("Enter your material items (one per line)")
        print("Format: qty X, size, product description")
        print("Example: qty 1, 6\" 769N preaction valve")
        print("Type 'done' when finished\n")

        lines = []
        while True:
            try:
                line = input(f"Item {len(lines) + 1}: ")
                if line.lower() in ('done', 'exit', 'quit', ''):
                    break
                lines.append(line)
            except (EOFError, KeyboardInterrupt):
                break

        if not lines:
            print("No items entered.")
            return

        materials = builder.build_material_list(lines)
        output_file = "material_list.csv"

    # File mode
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else "material_list.csv"

        with open(input_file, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        materials = builder.build_material_list(lines)

    # Export
    builder.export_to_csv(materials, output_file)

    # Print summary
    print(f"\n{'='*70}")
    print("MATERIAL LIST SUMMARY")
    print(f"{'='*70}")
    matched = sum(1 for m in materials if m["matched"])
    unmatched = len(materials) - matched

    print(f"Total items: {len(materials)}")
    print(f"Matched:     {matched}")
    print(f"Unmatched:   {unmatched}")

    if unmatched > 0:
        print(f"\n{'='*70}")
        print("UNMATCHED ITEMS (please review):")
        print(f"{'='*70}")
        for m in materials:
            if not m["matched"]:
                print(f"  Line {m['line_num']}: {m['original_input']}")

    print(f"\n{'='*70}")
    print("MATCHED ITEMS:")
    print(f"{'='*70}")
    print(f"{'Qty':<5} {'Size':<8} {'SKU':<12} {'Product Name':<40}")
    print("-" * 70)
    for m in materials:
        if m["matched"]:
            print(f"{m['qty']:<5} {m['size']:<8} {m['sku']:<12} {m['product_name'][:40]:<40}")

    print(f"\n{'='*70}")
    print(f"Output saved to: {output_file}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
