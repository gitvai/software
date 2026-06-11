import sys
import json
import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import *
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.barcode import code128

def number_to_words(n):
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    
    if n == 0: return "Zero"
    
    def convert(num):
        s = ""
        if num >= 100:
            s += ones[num // 100] + " Hundred "
            num %= 100
        if num >= 20:
            s += tens[num // 10] + " "
            num %= 10
        elif num >= 10:
            s += teens[num - 10] + " "
            num = 0
        if num > 0:
            s += ones[num] + " "
        return s
    
    res = ""
    if n >= 1000:
        res += convert(n // 1000) + "Thousand "
        n %= 1000
    res += convert(n)
    return res.strip() + " only"

def generate_invoice(data, output):
    # Set margins
    doc = SimpleDocTemplate(output, pagesize=A4, leftMargin=80, rightMargin=80, topMargin=75, bottomMargin=75)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='LabTitle', parent=styles['Heading1'], fontSize=20, leading=24, alignment=1, spaceAfter=5, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='NormalSmall', parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='NormalRight', parent=styles['Normal'], fontSize=9, leading=11, alignment=2, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='TableText', parent=styles['Normal'], fontSize=9, leading=11, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='TableTextCenter', parent=styles['Normal'], fontSize=9, leading=11, alignment=1, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='TableTextRight', parent=styles['Normal'], fontSize=9, leading=11, alignment=2, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='TableTeeth', parent=styles['Normal'], fontSize=9, leading=11, alignment=1, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='RequestedBy', parent=styles['Normal'], fontSize=10, leading=12, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='InvoiceTitle', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1, spaceBefore=5, spaceAfter=5))

    elements = []

    lab_name = "SOHAR DENTAL LABORATORY"
    lab_address = ["AL HAMBAR", "C.R.NO.3203549", "MOH NO. 1771", "SOHAR", "SULTANATE OF OMAN"]
    lab_contact = ["Phone : 99622728, 92501576", "email : sohardentallab@gmail.com"]

    client = data.get("client", {})
    orders = data.get("orders", [])

    # ---------------- HEADER ----------------
    elements.append(Paragraph(f"<b>{lab_name}</b>", styles["LabTitle"]))
    
    # Logo + Address + Contact row
    logo_path = os.path.join(os.path.dirname(__file__), "logo.jpeg")
    
    logo = ""
    try:
        if os.path.exists(logo_path):
            logo = Image(logo_path, 0.8*inch, 0.8*inch)
    except:
        logo = ""

    header_table_data = [[logo, Paragraph("<br/>".join(lab_address), styles["NormalSmall"]), Paragraph("<br/>".join(lab_contact), styles["NormalRight"])]]
    header_table = Table(header_table_data, colWidths=[75, 200, 250])
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('BOTTOMPADDING', (0,0), (-1,-1), 5), ('LINEBELOW', (0,0), (-1,-1), 2, colors.black)]))
    elements.append(header_table)

    # ---------------- TITLE ----------------
    elements.append(Paragraph("<b>Invoice</b>", styles["InvoiceTitle"]))

    # ---------------- CLIENT + INVOICE INFO BOX ----------------
    invoice_no = str(data.get("invoiceNumber", "N/A"))
    invoice_date = data.get("invoiceDate", "")
    
    # Barcode
    barcode = code128.Code128(invoice_no, barHeight=0.3*inch, barWidth=1.0)
    
    info_table_data = [
        [
            Paragraph(f"<b>{(client.get('name') or '').upper()}</b><br/>{(client.get('address') or '').upper()}", styles["NormalSmall"]),
            [
                Table([
                    [Paragraph("<b>Invoice #.</b>", styles["NormalSmall"]), Paragraph(f"<b>{invoice_no}</b>", styles["NormalRight"])],
                    [Paragraph("<b>Date</b>", styles["NormalSmall"]), Paragraph(f"<b>{invoice_date}</b>", styles["NormalRight"])],
                ], colWidths=[1*inch, 1.8*inch], style=TableStyle([('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)])),
                Spacer(1, 2),
                barcode
            ]
        ]
    ]
    
    info_table = Table(info_table_data, colWidths=[255, 180])
    info_table.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1.5, colors.black), ('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8), ('TOPPADDING', (0,0), (-1,-1), 8), ('BOTTOMPADDING', (0,0), (-1,-1), 8)]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # ---------------- ITEMS TABLE ----------------
    table_header = ["#", "Order #", "Patient", "Delivery Date", "Product", "Teeth #", "Units", "Rate /unit", "Total Amount"]
    table_data = [table_header]

    if orders and orders[0].get("doctorName"):
        table_data.append(["", Paragraph(f"Requested by Dr. {orders[0].get('doctorName').upper()}", styles["RequestedBy"]), "", "", "", "", "", "", ""])

    total_units = 0
    total_amount = sum((o.get("totalAmount") or o.get("price") or 0) for o in orders)

    for i, o in enumerate(orders):
        units = o.get("units") or 1
        total_units += units
        price = o.get("totalAmount") or o.get("price") or 0
        rate = price / units if units else 0
        
        p_type = (o.get('productType') or '').strip()
        p_name = (o.get('productName') or '').strip()
        product_desc = p_name if p_name else p_type
        shades = [o.get('shade1'), o.get('shade2'), o.get('shade3')]
        shades = [s for s in shades if s]
        if shades:
            product_desc += f"<br/><font size='7' color='gray'>Shade: {' / '.join(shades)}</font>"

        # Dental Chart Grid for PDF
        teeth_str = o.get("teethSelection") or ""
        teeth_grid = ""
        if teeth_str:
            quads = {1: [], 2: [], 3: [], 4: []}
            import re
            nums = re.split(r'[\s,]+', str(teeth_str))
            for n in nums:
                if n.isdigit():
                    val = int(n)
                    q = val // 10
                    num = val % 10
                    # Map deciduous quadrants (5-8) to permanent (1-4)
                    if q == 5: q = 1
                    if q == 6: q = 2
                    if q == 7: q = 3
                    if q == 8: q = 4
                    if q in quads: quads[q].append(num)
            
            # Sort teeth within each quadrant for consistency (Q1/Q4 descending, Q2/Q3 ascending)
            quads[1].sort(reverse=True)
            quads[2].sort()
            quads[3].sort()
            quads[4].sort(reverse=True)

            # Dental Chart 2x2 Cross
            grid_data = [
                [Paragraph("".join(map(str, quads[1])), styles["TableTeeth"]), Paragraph("".join(map(str, quads[2])), styles["TableTeeth"])],
                [Paragraph("".join(map(str, quads[4])), styles["TableTeeth"]), Paragraph("".join(map(str, quads[3])), styles["TableTeeth"])]
            ]
            # Use fixed column widths but allow dynamic row heights for alignment
            teeth_grid = Table(grid_data, colWidths=[42.5, 42.5])
            teeth_grid.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 2),
                ('RIGHTPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                # FDI Cross Borders - Thick and Clear
                ('LINEAFTER', (0,0), (0,1), 1.5, colors.black),
                ('LINEBELOW', (0,0), (1,0), 1.5, colors.black),
            ]))

        table_data.append([
            str(i+1),
            str(o.get("orderNumber") or o.get("id", "")),
            Paragraph(o.get("patientName", ""), styles["TableText"]),
            o.get("finishDate") or "",
            Paragraph(product_desc, styles["TableText"]),
            teeth_grid if teeth_grid else "",
            str(units),
            f"{rate:.2f}",
            f"{price:.2f}"
        ])

    table_data.append(["", "", "", "", "", Paragraph("<b>Total :</b>", styles["TableTextRight"]), Paragraph(f"<b>{total_units}</b>", styles["TableTextCenter"]), "", Paragraph(f"<b>{total_amount:.2f}</b>", styles["TableTextRight"])])

    col_widths = [15, 35, 60, 50, 70, 85, 25, 45, 50]
    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    items_style = [('GRID', (0,0), (-1,-1), 1, colors.black), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('ALIGN', (0,0), (-1,0), 'CENTER'), ('ALIGN', (0,-1), (-1,-1), 'RIGHT'), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,0), 9), ('LEFTPADDING', (0,0), (-1,-1), 3), ('RIGHTPADDING', (0,0), (-1,-1), 3)]
    if len(table_data) > 2 and "Requested" in str(table_data[1][1]): items_style.append(('SPAN', (1,1), (8,1)))
    items_style.append(('SPAN', (0,-1), (4,-1)))
    
    items_table.setStyle(TableStyle(items_style))
    elements.append(items_table)
    elements.append(Spacer(1, 10))

    # ---------------- GRAND TOTAL BAR ----------------
    grand_total_data = [[Paragraph(f"<b>Grand Total : OMR {number_to_words(int(total_amount))}</b>", styles["Normal"]), Paragraph(f"<b>OMR : {total_amount:.2f}</b>", styles["NormalRight"])]]
    grand_total_table = Table(grand_total_data, colWidths=[315, 120])
    grand_total_table.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1.5, colors.black), ('LEFTPADDING', (0,0), (-1,-1), 10), ('RIGHTPADDING', (0,0), (-1,-1), 10), ('TOPPADDING', (0,0), (-1,-1), 8), ('BOTTOMPADDING', (0,0), (-1,-1), 8)]))
    elements.append(grand_total_table)

    elements.append(Spacer(1, 50))
    elements.append(Paragraph("Authorized Signatory", styles["NormalRight"]))

    def draw_page_border(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.black)
        canvas.setLineWidth(1.5)
        # Outer border
        canvas.rect(37.5, 37.5, 595.27 - 75, 841.89 - 75)
        # Inner border
        canvas.rect(41, 41, 595.27 - 82, 841.89 - 82)
        canvas.restoreState()

    doc.build(elements, onFirstPage=draw_page_border, onLaterPages=draw_page_border)

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(1)
    try:
        with open(sys.argv[1]) as f: invoice_data = json.load(f)
        generate_invoice(invoice_data, sys.argv[2])
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)