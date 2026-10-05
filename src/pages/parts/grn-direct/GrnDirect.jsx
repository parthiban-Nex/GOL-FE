import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Filter,
  Printer,
  Eye,
  ShoppingCart,
  ScanLine,
  Plus,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import IconAction from "@/components/ui/IconAction";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import { showToast } from "@/utils/toast";
import AddGrnModal from "./AddGrnModal";
import AddBulkCsvModal from "./AddBulkCsvModal";
import ViewGrnModal from "@/components/parts/ViewGrnModal";
import GrnDirectFilterModal from "@/components/parts/GrnDirectFilterModal";
import { grnApi } from "@/services/api/grnApi";
import jsPDF from "jspdf";
import mytvslogo from "../../../assets/images/tvslogo.png"

const SEARCH_DEBOUNCE_MS = 400;

const num = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

export default function GrnDirect() {
  const { canCreate, canRead } = usePagePermissions();

  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ vendorCode: "ALL" });

  // Server-side pagination (grnApi.getGrns takes limit + offset).
  const [page, setPage] = useState(1); // assumes 1-based, like the Pagination component
  const [pageSize, setPageSize] = useState(25);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const [isAddGrnOpen, setIsAddGrnOpen] = useState(false);
  const [isBulkCsvOpen, setIsBulkCsvOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingGrn, setViewingGrn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Debounce the search box so it doesn't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        searchKey: searchQuery,
      };
      // Only send filters that are actually set. Confirm your API accepts these.
      if (filters.vendorCode && filters.vendorCode !== "ALL") {
        payload.vendorCode = filters.vendorCode;
      }
      if (filters.fromDate) payload.fromDate = filters.fromDate;
      if (filters.toDate) payload.toDate = filters.toDate;

      const res = await grnApi.getGrns(payload);
      if (res?.requestSuccessful) {
        setData(res?.data ?? []);
        setTotalItems(res?.count ?? 0);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch {
      showToast.error("Failed to load GRN direct records");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateGrn({ items, ...form }) {
    const grnparts = items.map((it) => {
      const qty = num(it.receivedQty);
      const cost = num(it.cost);
      const total = num(it.totalAmount);
      const gst = total - cost * qty;

      return {
        item_id: it.itemId ?? 0,
        item_code: it.partNo,
        item_description: it.description,
        sup_invoice_quantity: num(it.supInvQty),
        quantity: qty,
        rate: cost,
        cost,
        mrp: num(it.mrp),
        discount: num(it.discount),
        binlocation: it.binLocation ? parseInt(it.binLocation, 10) : 0,
        cgst: gst / 2,
        sgst: gst / 2,
        igst: 0,
        total,
        binid: it.binId ?? 0,
      };
    });

    const payload = {
      type: "DirectGrn", // change if Auto GRN uses a different type
      grndata: {
        document_type: form.grnName,
        invoice_number: form.supplierInvoiceNumber,
        invoice_date: form.invoiceDate,
        vendor_id: form?.vendorId,
        vendor_code: form?.vendorCode,
        e_sugam_no: form.eSugamNumber,
        lr_number: form.lrNumber,
        lr_date: form.lrDate,
        transport_name: form.transportName,
        frieght_charges: num(form.freightCharges), // spelling matches your API
        mis_charges: num(form.miscellaneousCharges),
        status: 1,
      },
      grnparts,
      bindata: items
        .filter((it) => it.binId)
        .map((it) => ({
          binid: Number(it.binId),
          quantity: num(it.receivedQty),
        })),
    };

    setIsSubmitting(true);
    try {
      await grnApi.quickAdd(payload);
      showToast.success("Direct GRN created successfully");
      setIsAddGrnOpen(false);
      if (page === 1) loadData();
      else setPage(1); // the effect reloads page 1
    } catch (err) {
      showToast.error(err.message || "Failed to create Direct GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadCsv(file) {
    setIsUploading(true);
    try {
      const res = await partsApi.uploadGrnBulkCsv(file);
      showToast.success(res.message || "CSV processed successfully");
      setIsBulkCsvOpen(false);
      loadData();
    } catch (err) {
      showToast.error(err.message || "Failed to import CSV");
    } finally {
      setIsUploading(false);
    }
  }

 const activeFilterCount =
  (filters.vendorCode && filters.vendorCode !== "ALL" ? 1 : 0) +
  (filters.fromDate ? 1 : 0) +
  (filters.toDate ? 1 : 0);
     const handlePdfClick = async(row) => {
   const response =await grnApi.getGrnPdf({id:row.id})
  //  if(blob.data && blob.data.type=="application/pdf"){
  //     const url = window.URL.createObjectURL(blob.data);

  //     // Create a link element
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', 'grn.pdf'); // Set the file name
  //     document.body.appendChild(link);
  
  //     // Trigger the download
  //     link.click();
  
  //     // Clean up
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //     // let  message = "Purchase Order Report Downloaded Successfully"
  //     //   setDataStatusConfirm('Success');
  //     //   reset();
       
  //     // setSnackBarMessage(message);

  //   } 
  //   else {
  //          console.log(err,"err")
  //       setDataStatusConfirm('Error');
  //       // message = response.error.data.validationErrors;
      
  //     setSnackBarMessage(blob?.error?.data?.message || "An unexpected error occurred.");
  //   }


if(response?.requestSuccessful){
     const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return str
};


    const deepSanitize = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deepSanitize(value)])
    );
  } else {
    return sanitizeString(obj);
  }
};
const sanitize=deepSanitize(response)
console.log(sanitize,"sanitize")
   const outletdetails=sanitize.outlet_details
   const vendordatails=sanitize.data[0].grnvendormap
   const grndetails=sanitize.data[0]
   const partsdetails=sanitize.data[0].grnparts
   const podetails=sanitize.data[0].pogrnmap
   function numberToWordsIndian(num) {
    if (num === 0) return 'zero';

    const belowTwenty = [
        'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const tens = [
        'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];
    const scales = [
        '', 'thousand', 'lakh', 'crore'
    ];

    function helper(n) {
        if (n === 0) return '';
        if (n < 20) return belowTwenty[n - 1] + ' ';
        if (n < 100) return tens[Math.floor(n / 10) - 2] + ' ' + helper(n % 10);
        if (n < 1000) return belowTwenty[Math.floor(n / 100) - 1] + ' hundred ' + (n % 100 !== 0 ? 'and ' : '') + helper(n % 100);
    }

    function convertWholeNumber(n) {
        let word = '';
        let scaleIndex = 0;

        while (n > 0) {
            let chunk;
            if (scaleIndex === 0) {
                // First segment (thousands), handle 3 digits
                chunk = n % 1000;
                n = Math.floor(n / 1000);
            } else {
                // Lakhs and Crores, handle 2 digits
                chunk = n % 100;
                n = Math.floor(n / 100);
            }

            if (chunk !== 0) {
                word = helper(chunk) + scales[scaleIndex] + ' ' + word;
            }

            scaleIndex++;
        }

        return word.trim();
    }

    // Separate the rupees and paisa
    const rupees = Math.floor(num);
    const paisa = Math.round((num - rupees) * 100);

    let result = '';
    if (rupees > 0) {
        result += convertWholeNumber(rupees) + ' rupees ';
    }

    if (paisa > 0) {
        result += 'and ' + convertWholeNumber(paisa) + ' paisa';
    }

    return result.trim();
}


const amountInWords = numberToWordsIndian(grndetails.pdf_total+grndetails.frieght_charges+grndetails.mis_charges);


    const doc = new jsPDF();
    const pageHeight = 841.89;
    
// doc.addFileToVFS("CustomFont.ttf", base64Font);
// doc.addFont("CustomFont.ttf", "CustomFont", "normal");
// // Step 2: Set the custom font globally
// doc.setFont("CustomFont");
    const htmlstring=`
    <body>
    <style>
    body {
      font-family: 'Inter'
      font-size:12px;
    }
  </style>
    <div style="color: black; text-align:justify;letter-spacing: 0.01px;">
    <div style="display: flex;flex-direction: row;justify-content:space-between;align-item:flex-start;">
    <div style="flex:5;margin-top:20px">
    <p style="font-weight:500;margin:0">
    ${outletdetails.outlet_name}
    </p>
    <p style="font-weight:500;margin:0">
    ${outletdetails.outlet_address1}
    </p>
    <p style="font-weight:500;margin:0">
    ${outletdetails.outlet_address2}
    </p>
    <p style="font-weight:500;margin:0">
    ${outletdetails.outlet_city}
    </p>
    </div>
    <div style="flex:4;display: flex; justify-content: flex-end;margin-top:20px">
    <img src="${mytvslogo}" style="width: 150px; height: 40px;"/>
    </div>
    </div>
    <div style="display:flex;flex-direction:row;line-height:0.5;margin-top:5px">
    <p>
    DEALER GSTIN : 
    </p>
    <p>
     ${outletdetails.outlet_gst}
    </p>
    </div>
    <div>
    <p style="color:#aa2e2b; font-size:16px;font-weight:bold;text-align:center;border-bottom:1px solid black">
    SPARE PURCHASE RECEIPT
    </p>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 20px;">
    <div style="flex: 1;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">SUPPLIER CODE</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${row.vendor_code}</span>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">SUPPLIER ADDRESS</span>
            <span style="margin: 0 10px;">:</span>
            <div style="flex: 2">
            <p style="text-align: left;margin:0;">${vendordatails?.address1||""}</p>
            <p style="text-align: left;margin:0">${vendordatails?.address2||""}</p>
            <p style="text-align: left;margin:0">${vendordatails?.city||""} ${vendordatails?.pincode||""}</p>
            <p style="text-align: left;margin:0">${vendordatails?.mobileNumber ? "Mobile Number:"+ vendordatails?.mobileNumber :""}</p>
            </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">SUPPLIER INVOICE NUMBER</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${row.invoice_number}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">TIN No</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">0</span>
        </div>
    </div>
    <div style="flex: 1;">
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">DOCUMENT</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${row.grn_no}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">DOC DATE</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${row.invoice_date}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">BRANCH</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${outletdetails.branch}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">E-SUGAM/ROAD PERMIT NO</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${grndetails.e_sugam_no ||""}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">LR NUMBER</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${grndetails.lr_number||""}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">TRANSPORTER NAME</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;"> ${grndetails.transport_name||""}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; flex: 1;">LR DATE</span>
            <span style="margin: 0 10px;">:</span>
            <span style="flex: 2; text-align: left;">${grndetails.lr_date||""}</span>
        </div>
    </div>
</div>

    <table style="border-collapse: collapse;margin-top:10px; width: 100%;">
    <tr>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">SNO</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">CODE</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">NAME</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">Po Number</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">LOCATION</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">QTY</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">Cost</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">DISC</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">TAX</td>
        <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">AMOUNT</td>
    </tr>
    ${partsdetails.map((item, index) => `
      <tr>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">${index + 1}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">${item.item_code}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;max-width:100pt;">${item.item_description}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">${podetails ? podetails.po_number: ''}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">${item.binlocation}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: center; color: black;">${item.quantity}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: right; color: black;">${item.cost }</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: right; color: black;">${item.discount}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: right; color: black;">${item.tax}</td>
          <td style="border: 1pt solid black; padding-top: 3px; padding-bottom: 3px; text-align: right; color: black;">${item.total}</td>
      </tr>
      `).join('')}
    <tr>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;" colspan="5">SUB TOTAL</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: center; color: black;">${grndetails.total_quantity}</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.total_cost}</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.total_discount}</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.total_tax}</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.pdf_total}</td>
    </tr>
    <tr>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;" colspan="9">Freight Charges</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.frieght_charges}</td>
    </tr>
    <tr>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;" colspan="9">Mis Charges</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.mis_charges}</td>
    </tr>
    <tr>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;" colspan="9">Net Amount</td>
        <td style="border: 1pt solid black; padding-top: 2px; padding-bottom: 2px; text-align: right; color: black;">${grndetails.pdf_total+grndetails.frieght_charges+grndetails.mis_charges}</td>
    </tr>
</table>
<div style="display: flex; justify-content:flex-start;">
<p style="font-weight: 600;margin-right:10pt">
AMOUNT IN WORDS: 
</P>
<p >
Rupees ${amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1)} only
</p>
</div>
<div style="margin-top:50pt">
<p style="text-align:right;font-weight:600">
For  ${outletdetails.outlet_name}
</p>
</div>
<div style="display: flex; justify-content:space-between;margin-top:40pt">
<div style="border-top: 2px solid #a2a0a0;padding-right:30pt">
<p style="font-weight:600;margin:0">
Customer Signature   
</p>
</div>
<div style="border-top: 2px solid #a2a0a0;padding-left:30pt">
<p style="font-weight:600;margin:0">
Authorized Signature
</p>
</div>
</div>
</div>
</body>
`

    doc.html(htmlstring, {
        callback: function (pdf) {
          const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.text('Regd. Off. No. 10, Jawahar Road, Madurai – 625 002', 105, 285, { align: 'center' });
      pdf.text('Mail id: enquiry@tvs.in, Website: www.tvsautomobilesolutions.com', 105, 289, { align: 'center' });
      pdf.text('ki Mobility Solutions Private Limited (formerly Peninsula Auto Parts Private Limited)', 105, 293, { align: 'center' });
    }
            
    pdf.save('SparePurchaseReceipt.pdf');
        },
          x: 10,
        y: 0,
        width: 170, // Width in mm
        windowWidth: 800, // Adjusts the window width for rendering
  margin: [10, 10, 22, 10],   // <-- bottom margin now ~22mm, reserving room for the 3-line footer
        autoPaging: 'text'
    });
  }
  else{

  }
  };
  // Row fields come straight from grnApi.getGrns (snake_case), same keys the
  // old GRN page used: grn_no, vendor_code, invoice_number, invoice_date...
  const columns = [
    {
      key: "grn_no",
      header: "GRN Number",
      render: (row) => (
        <span className="font-semibold text-brand-900">{row.grn_no}</span>
      ),
    },
    {
      key: "po_number",
      header: "PO Number",
      render: (row) => (
        <span className="font-semibold text-brand-900">
          {row.po_number ?? row.pogrnmap?.po_number ?? "-"}
        </span>
      ),
    },
    { key: "vendor_code", header: "Vendor Code" },
    { key: "invoice_number", header: "Supplier Invoice Number" },
    { key: "invoice_date", header: "Invoice Date" },
    {
      key: "grand_total",
      header: "Grand Total",
      render: (row) => {
        const total =
          row.grand_total ??
          num(row.pdf_total) + num(row.frieght_charges) + num(row.mis_charges);
        return <span className="font-bold text-ink-900">{total}</span>;
      },
    },
    ...(canRead
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex">
                <IconAction
                  icon={Printer}
                  label="Print GRN Slip"
                  tone="print"
                  onClick={()=>handlePdfClick(row)}
                />
                <IconAction
                  icon={Eye}
                  label="View Inward Note"
                  tone="brand"
                  onClick={() => setViewingGrn(row)}
                />
                <IconAction
                  icon={ScanLine}
                  label="Scan Barcode"
                  tone="assign"
                  disabled
                />
                {row.hasCart && (
                  <IconAction
                    icon={ShoppingCart}
                    label="Purchase Cart"
                    tone="cart"
                    disabled={!canCreate}
                    onClick={
                      canCreate
                        ? () =>
                            showToast.success(
                              `Cart opened for PO ${row.po_number ?? ""}`,
                            )
                        : undefined
                    }
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

 
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-ink-800">GRN Direct</h1>
        {canCreate && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => setIsBulkCsvOpen(true)}
            >
              Add Bulk CSV
            </Button>
            <Button icon={Plus} onClick={() => setIsAddGrnOpen(true)}>
              Add GRN
            </Button>
          </div>
        )}
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="max-w-sm flex-1">
            <Input
              icon={Search}
              placeholder="Search GRN"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`rounded-md border p-2 transition-colors cursor-pointer ${
              activeFilterCount > 0
                ? "border-accent-500 bg-accent-50 text-accent-600"
                : "border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
            title="Filter"
            aria-label="Filter"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <Table
          columns={columns}
          data={data}
          isLoading={isLoading}
          getRowId={(row) => row.id ?? row.grn_no}
          emptyTitle="No GRN direct records found"
          emptyDescription="Try a different search or clear the filters."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <AddGrnModal
        isOpen={isAddGrnOpen}
        onClose={() => setIsAddGrnOpen(false)}
        onSubmit={handleCreateGrn}
        isSubmitting={isSubmitting}
      />

      <AddBulkCsvModal
        isOpen={isBulkCsvOpen}
        onClose={() => setIsBulkCsvOpen(false)}
        onUpload={handleUploadCsv}
        isUploading={isUploading}
        loadData={loadData}
      />

      <ViewGrnModal
        isOpen={Boolean(viewingGrn)}
        onClose={() => setViewingGrn(null)}
        grn={viewingGrn}
      />

      <GrnDirectFilterModal
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  filters={filters}
  onApply={(f) => {
    setFilters((prev) => ({ ...prev, ...f }));
    setPage(1);
  }}
  onReset={(f) => {
    setFilters(f);
    setPage(1);
  }}
/>
    </div>
  );
}