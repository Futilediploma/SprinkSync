"""
Excel Import Script for Manpower Forecast Database
Imports from:
1. OPERATIONS LOG - Active projects
2. PIPELINE TRACKER - Bid and sold projects
"""

import pandas as pd
import sqlite3
from datetime import datetime
import os

# Configuration
DB_PATH = "../backend/manpower_forecast.db"
OPERATIONS_FILE = "OPERATIONS 08-31-16 (Latest).xls"
PIPELINE_FILE = "BFPE Sprinkler Pipeline & Tracker - MASTER.xlsm"

def clean_string(value):
    """Clean string values"""
    if pd.isna(value):
        return None
    return str(value).strip()

def clean_number(value):
    """Clean numeric values"""
    if pd.isna(value):
        return None
    try:
        return float(value)
    except:
        return None

def clean_date(value):
    """Clean date values"""
    if pd.isna(value):
        return None
    try:
        if isinstance(value, datetime):
            return value.strftime('%Y-%m-%d')
        return pd.to_datetime(value).strftime('%Y-%m-%d')
    except:
        return None

def parse_boolean(value, true_values=['Out of Town', 'Yes', 'TRUE', '1']):
    """Parse boolean from string"""
    if pd.isna(value):
        return 0
    return 1 if str(value).strip() in true_values else 0

def import_operations_log(conn):
    """Import from Operations Data Sheet"""
    print("\n--- Importing Operations Log ---")

    try:
        df = pd.read_excel(OPERATIONS_FILE, sheet_name='Operations Data Sheet')

        # Rename columns for easier access
        df.columns = ['job_name', 'job_number', 'date_created', 'sales_person',
                      'designer', 'field_super', 'contractor', 'scope_of_work',
                      'head_count', 'coord_dept', 'ahj', 'contract_amount', 'comments']

        cursor = conn.cursor()
        imported = 0
        skipped = 0

        for _, row in df.iterrows():
            job_name = clean_string(row['job_name'])
            job_number = clean_string(row['job_number'])

            if not job_name or job_name.startswith('Date:'):
                continue

            # Check if project already exists
            cursor.execute("SELECT id FROM projects WHERE project_number = ?", (job_number,))
            if cursor.fetchone():
                skipped += 1
                continue

            # Build notes from multiple fields
            notes_parts = []
            if clean_string(row['scope_of_work']):
                notes_parts.append(f"Scope: {clean_string(row['scope_of_work'])}")
            if clean_string(row['comments']):
                notes_parts.append(f"Comments: {clean_string(row['comments'])}")
            if clean_string(row['ahj']):
                notes_parts.append(f"AHJ: {clean_string(row['ahj'])}")
            if clean_string(row['sales_person']):
                notes_parts.append(f"Sales: {clean_string(row['sales_person'])}")
            if clean_string(row['designer']):
                notes_parts.append(f"Designer: {clean_string(row['designer'])}")
            if clean_string(row['field_super']):
                notes_parts.append(f"Field Super: {clean_string(row['field_super'])}")

            notes = " | ".join(notes_parts) if notes_parts else None

            # Extract contractor name (before phone number)
            contractor = clean_string(row['contractor'])
            if contractor and '\n' in contractor:
                contractor = contractor.split('\n')[0]

            cursor.execute("""
                INSERT INTO projects (name, customer_name, project_number, status, notes,
                                      budgeted_hours, is_mechanical, is_electrical, is_vesda,
                                      is_aws, is_out_of_town)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job_name,
                contractor,
                job_number,
                'active',
                notes,
                clean_number(row['contract_amount']),
                1,  # is_mechanical - default true for sprinkler
                0,  # is_electrical
                0,  # is_vesda
                0,  # is_aws
                0   # is_out_of_town
            ))
            imported += 1

        conn.commit()
        print(f"Imported: {imported} projects, Skipped (duplicates): {skipped}")

    except Exception as e:
        print(f"Error importing operations log: {e}")
        raise

def import_pipeline_tracker(conn):
    """Import from Pipeline Tracker sheets"""
    print("\n--- Importing Pipeline Tracker ---")

    # Sheets to import and their status mapping
    sheets_config = {
        'IAD Bid Tracker': 'bid',
        'Data Center (Non IAD) Tracker': 'bid',
        'Contract Project': 'bid',
        'TI': 'bid',
        'IAD Sold Projects': 'active',
        'Data Center Sold Projects': 'active',
        'Contract Project Sold Projects': 'active',
        'TI Sold Projects': 'active'
    }

    try:
        xls = pd.ExcelFile(PIPELINE_FILE)
        cursor = conn.cursor()
        total_imported = 0
        total_skipped = 0

        for sheet_name, default_status in sheets_config.items():
            if sheet_name not in xls.sheet_names:
                print(f"Sheet '{sheet_name}' not found, skipping")
                continue

            print(f"\nProcessing: {sheet_name}")
            df = pd.read_excel(xls, sheet_name=sheet_name)

            if df.empty or 'Bid Name' not in df.columns:
                print(f"  No valid data in {sheet_name}")
                continue

            imported = 0
            skipped = 0

            for _, row in df.iterrows():
                bid_name = clean_string(row.get('Bid Name'))
                record_id = clean_string(row.get('Record ID'))

                if not bid_name:
                    continue

                # Check if project already exists (by record_id as project_number)
                cursor.execute("SELECT id FROM projects WHERE project_number = ?", (record_id,))
                if cursor.fetchone():
                    skipped += 1
                    continue

                # Determine status from Stage column or default
                stage = clean_string(row.get('Stage', ''))
                if stage == 'Won':
                    status = 'active'
                elif stage == 'Lost':
                    status = 'lost'
                elif stage == 'Open':
                    status = 'bid'
                else:
                    status = default_status

                # Check owner for AWS flag
                owner = clean_string(row.get('Owner', ''))
                is_aws = 1 if owner and 'AWS' in owner.upper() else 0

                # Build notes
                notes_parts = []
                if owner:
                    notes_parts.append(f"Owner: {owner}")
                if clean_string(row.get('Notes')):
                    notes_parts.append(clean_string(row.get('Notes')))
                probability = clean_string(row.get('Probability %'))
                if probability:
                    notes_parts.append(f"Probability: {probability}")
                sq_ft = clean_number(row.get('Square Footage'))
                if sq_ft:
                    notes_parts.append(f"Sq Ft: {int(sq_ft)}")
                manpower = clean_number(row.get('Estimated Manpower'))
                if manpower:
                    notes_parts.append(f"Est Manpower: {int(manpower)}")

                notes = " | ".join(notes_parts) if notes_parts else None

                cursor.execute("""
                    INSERT INTO projects (name, customer_name, project_number, status, notes,
                                          budgeted_hours, start_date, is_mechanical, is_electrical,
                                          is_vesda, is_aws, is_out_of_town)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    bid_name,
                    clean_string(row.get('Contractor/Client')),
                    record_id,
                    status,
                    notes,
                    clean_number(row.get('Est Value ($)')),
                    clean_date(row.get('On Site Start Date')),
                    1,  # is_mechanical
                    0,  # is_electrical
                    0,  # is_vesda
                    is_aws,
                    parse_boolean(row.get('Local/Out of Town'))
                ))
                imported += 1

            total_imported += imported
            total_skipped += skipped
            print(f"  Imported: {imported}, Skipped: {skipped}")

        conn.commit()
        print(f"\nTotal Pipeline: Imported {total_imported}, Skipped {total_skipped}")

    except Exception as e:
        print(f"Error importing pipeline tracker: {e}")
        raise

def main():
    print("=" * 60)
    print("MANPOWER FORECAST - EXCEL IMPORT")
    print("=" * 60)

    # Verify files exist
    if not os.path.exists(OPERATIONS_FILE):
        print(f"ERROR: Operations file not found: {OPERATIONS_FILE}")
        return
    if not os.path.exists(PIPELINE_FILE):
        print(f"ERROR: Pipeline file not found: {PIPELINE_FILE}")
        return
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found: {DB_PATH}")
        return

    # Connect to database
    conn = sqlite3.connect(DB_PATH)

    try:
        # Import pipeline tracker only (operations log is entered manually)
        # import_operations_log(conn)  # Disabled - entering manually
        import_pipeline_tracker(conn)

        # Show summary
        cursor = conn.cursor()
        cursor.execute("SELECT status, COUNT(*) FROM projects GROUP BY status")
        print("\n" + "=" * 60)
        print("DATABASE SUMMARY")
        print("=" * 60)
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} projects")

        cursor.execute("SELECT COUNT(*) FROM projects")
        print(f"\n  TOTAL: {cursor.fetchone()[0]} projects")

    finally:
        conn.close()

    print("\nImport complete!")

if __name__ == "__main__":
    main()
