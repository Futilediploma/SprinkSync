import pandas as pd
import os

# Analyze Operations Log
print("=" * 60)
print("OPERATIONS LOG STRUCTURE")
print("=" * 60)
try:
    ops_file = "OPERATIONS 08-31-16 (Latest).xls"
    xls = pd.ExcelFile(ops_file)
    print(f"Sheet names: {xls.sheet_names}")

    for sheet in xls.sheet_names[:3]:  # First 3 sheets
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(xls, sheet_name=sheet, nrows=5)
        print(f"Columns: {list(df.columns)}")
        print(f"Sample data:\n{df.head(2)}")
except Exception as e:
    print(f"Error reading operations log: {e}")

print("\n" + "=" * 60)
print("PIPELINE TRACKER STRUCTURE")
print("=" * 60)
try:
    pipeline_file = "BFPE Sprinkler Pipeline & Tracker - MASTER.xlsm"
    xls = pd.ExcelFile(pipeline_file)
    print(f"Sheet names: {xls.sheet_names}")

    for sheet in xls.sheet_names[:3]:  # First 3 sheets
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(xls, sheet_name=sheet, nrows=5)
        print(f"Columns: {list(df.columns)}")
        print(f"Sample data:\n{df.head(2)}")
except Exception as e:
    print(f"Error reading pipeline tracker: {e}")
