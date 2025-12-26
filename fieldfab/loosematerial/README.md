# Victaulic Fire Protection Product Tools

Two-part system for managing fire protection product material lists.

## Tools Overview

1. **firescrape.py** - Scrapes Victaulic's website to build a product database
2. **material_list_builder.py** - Converts your material list into a structured CSV with product details

---

## 1. Product Database Scraper (`firescrape.py`)

### What it does:
- Scrapes all products from Victaulic's sitemap
- Filters for fire protection products only
- Extracts: SKU, product name, category, size range, description, URL
- Saves to `victaulic_fire_protection_products.csv`

### Usage:

```bash
python firescrape.py
```

### Output:
Creates `victaulic_fire_protection_products.csv` with columns:
- `sku` - Model/Style number (e.g., "769N", "232", "FL-QR")
- `product_name` - Full product name
- `category` - Product category (Valves, Sprinklers, Couplings, Fittings, etc.)
- `size_range` - Available sizes (e.g., "4 - 6" | DN100 - DN150")
- `short_description` - Brief product description
- `product_url` - Link to product page

### Important Notes:
- Takes time to run (scrapes hundreds of products)
- Respects robots.txt
- Has 0.6 second delay between requests
- Re-run periodically to update product database

---

## 2. Material List Builder (`material_list_builder.py`)

### What it does:
- Parses your material list input
- Matches items against the product database
- Extracts quantity, size, and product from each line
- Creates a structured CSV for ordering/tracking

### Usage:

#### Option 1: From a text file
```bash
python material_list_builder.py input.txt output.csv
```

#### Option 2: Interactive mode
```bash
python material_list_builder.py
```
Then enter items one by one.

### Input Format:

The builder is flexible and accepts various formats:

```
qty 1, 6" 769N preaction valve
2x 4" style 232 coupling
qty 5, 2 inch, series 721 ball valve
3, 8", style 234 flexible coupling
1x firelock series FL-QR sprinkler
qty 10, 6" grooved fittings
```

**Format breakdown:**
- **Quantity**: `qty X`, `Xx`, or just `X`
- **Size**: `6"`, `6 inch`, or within commas
- **Product**: SKU/model number + description

### Output:

Creates a CSV with columns:
- `line_num` - Original line number
- `qty` - Quantity
- `size` - Size specified
- `sku` - Matched product SKU
- `product_name` - Full product name
- `category` - Product category
- `size_range` - Available sizes for this product
- `product_url` - Link to product details
- `matched` - True/False if product was found
- `original_input` - Your original input line

### Matching Logic:

1. **SKU Match** - Looks for exact SKU in your input (e.g., "769N", "232")
2. **Name Match** - Fuzzy matches product names
3. **Keyword Match** - Matches on common words (minimum 2 words)

**Pro Tip**: For best results, include the SKU/Style/Series number in your input.

---

## Complete Workflow Example

### Step 1: Build Product Database (one-time, or periodic updates)
```bash
python firescrape.py
```
Wait for scraping to complete → creates `victaulic_fire_protection_products.csv`

### Step 2: Create Your Material List
Create `my_materials.txt`:
```
qty 1, 6" 769N preaction valve
2x 4" style 232 coupling
5, 2", series 721 ball valve
```

### Step 3: Generate Structured Material List
```bash
python material_list_builder.py my_materials.txt my_order.csv
```

### Step 4: Review Output
- Check `my_order.csv` in Excel/Google Sheets
- Review any unmatched items
- Verify sizes are correct
- Add pricing if needed

---

## Tips & Tricks

### For Better Matching:
- Include SKU/Style/Series numbers when you know them
- Use consistent naming (e.g., "Style 232" not just "232")
- Specify sizes clearly with units

### Common Input Patterns:
```
qty 2, 6" style 769N preaction valve
3x 4 inch firelock coupling
5, DN100, series 721 valve
qty 10, 2", grooved fittings
```

### If Items Don't Match:
1. Check the product database CSV - is the product there?
2. Try different keywords from the product name
3. Re-run the scraper to get latest products
4. Manually add to the output CSV

---

## Requirements

Install dependencies:
```bash
pip install requests beautifulsoup4 lxml
```

---

## File Structure

```
building tools/
├── firescrape.py                              # Product database scraper
├── material_list_builder.py                   # Material list converter
├── victaulic_fire_protection_products.csv     # Product database (generated)
├── sample_materials.txt                       # Example input
├── README.md                                  # This file
└── venv/                                      # Virtual environment
```

---

## Troubleshooting

**Problem**: No products scraped
- Check internet connection
- Verify Victaulic website is accessible
- Check if robots.txt blocks scraping

**Problem**: Poor matching results
- Re-run scraper to update database
- Include more specific product info (SKU numbers)
- Check spelling of product names

**Problem**: Missing SKU/size data
- Some products may not have this info on website
- Manually add to database CSV if needed

---

## Future Enhancements

Potential additions:
- Price integration
- Stock availability checking
- Multiple vendor support
- Auto-generate submittal packages
- Integration with ordering systems
