import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  Columns2, 
  Paperclip, 
  Send, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Share2,
  Mail,
  Download,
  Check,
  ChevronDown,
  CircleDot,
  Circle
} from 'lucide-react';
import { initialCustomers, MAKES, MODELS_BY_MAKE, FUELS } from '@/pages/customers/mockCustomers';
import { ROUTES } from '@/constants/routes';
import { showToast } from '@/utils/toast';

const CATALOGUE_ITEMS = [
  {
    id: 'p1',
    kind: 'Part',
    name: 'AIR CLEANER ELEMENT',
    code: '54636',
    hsn: '54636',
    category: 'Filters',
    defaultQty: 1,
    rate: 2288,
    sgst: 0,
    cgst: 0,
    igst: 18,
    disc: 10,
    tiers: [
      { qty: 183.00, rate: 231.00 },
      { qty: 0.00, rate: 209.00 },
    ],
  },
  {
    id: 'p2',
    kind: 'Part',
    name: 'OIL FILTER',
    code: '8421',
    hsn: '8421',
    category: 'Filters',
    defaultQty: 1,
    rate: 2288,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 5,
    tiers: [
      { qty: 1, rate: 2288.00 },
    ],
  },
  {
    id: 'p3',
    kind: 'Part',
    name: 'SPARK PLUG',
    code: '8511',
    hsn: '8511',
    category: 'Engine Oil',
    defaultQty: 4,
    rate: 2288,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 0,
    tiers: [
      { qty: 4, rate: 2288.00 },
    ],
  },
  {
    id: 'p4',
    kind: 'Part',
    name: 'BRAKE PAD SET',
    code: '4009',
    hsn: '4009',
    category: 'Brake Pads',
    defaultQty: 1,
    rate: 2800,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 0,
    tiers: [
      { qty: 1, rate: 2800.00 },
    ],
  },
  {
    id: 'l1',
    kind: 'Labour',
    name: 'General Service',
    code: 'LAB-100',
    subtext: 'LAB-100 · Paid Service',
    category: 'General',
    hrs: 1.5,
    rate: 600,
    sgst: 0,
    cgst: 0,
    igst: 18,
    disc: 0,
    gstLabel: 'GST 18%',
  },
  {
    id: 'l2',
    kind: 'Labour',
    name: 'Wheel Alignment',
    code: 'LAB-200',
    subtext: 'LAB-200 · Paid Service',
    category: 'General',
    hrs: 1.0,
    rate: 800,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 10,
    gstLabel: 'GST 18%',
  },
];

const CATEGORIES = ['Bearings', 'Body Parts', 'Brake Pads', 'Clutch', 'Engine Oil', 'Filters', 'Gaskets', 'Headlights'];

function computeItemTotals(item) {
  const qty = Number(item.qty ?? item.hrs ?? 1);
  const rate = Number(item.rate ?? 0);
  const base = qty * rate;
  const discPercent = Number(item.disc ?? 0);
  const discAmount = base * (discPercent / 100);
  const afterDisc = base - discAmount;
  const taxRate = Number(item.sgst ?? 0) + Number(item.cgst ?? 0) + Number(item.igst ?? 0);
  const taxAmount = afterDisc * (taxRate / 100);
  const total = afterDisc + taxAmount;
  return { base, discAmount, afterDisc, taxAmount, total };
}

function formatINR(val) {
  const num = Number(val || 0);
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const QuicklinkCreateEstimate = ({ onBack, onNavigate }) => {
 
  const [flowStatus, setFlowStatus] = useState('IDLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);


  const [activeCategory, setActiveCategory] = useState('Bearings');

  const [selectedItemIds, setSelectedItemIds] = useState(['p1', 'p3', 'p4', 'l1']);
  const [itemQuantities, setItemQuantities] = useState({
    p1: 1,
    p2: 1,
    p3: 1,
    p4: 1,
    l1: 1.5,
    l2: 1.0,
  });
  const [itemRates, setItemRates] = useState({
    p1: 231,
    p2: 2288,
    p3: 2288,
    p4: 2800,
    l1: 600,
    l2: 800,
  });
  const [openRateTierId, setOpenRateTierId] = useState(null);

  const [estimateParts, setEstimateParts] = useState([
    { id: 'p1', code: '54636', name: 'AIR CLEANER ELEMENT', hsn: '54636', qty: 1, rate: 2288, sgst: 0, cgst: 0, igst: 18, disc: 10 },
    { id: 'p2', code: '8421', name: 'OIL FILTER', hsn: '8421', qty: 1, rate: 2288, sgst: 9, cgst: 9, igst: 0, disc: 5 },
    { id: 'p3', code: '8511', name: 'SPARK PLUG', hsn: '8511', qty: 4, rate: 2288, sgst: 9, cgst: 9, igst: 0, disc: 0 },
  ]);

  const [estimateLabour, setEstimateLabour] = useState([
    { id: 'l1', code: 'LAB-100', description: 'General Service', hrs: 1.5, rate: 600, sgst: 0, cgst: 0, igst: 18, disc: 0 },
    { id: 'l2', code: 'LAB-200', description: 'Wheel Alignment', hrs: 1.0, rate: 800, sgst: 9, cgst: 9, igst: 0, disc: 10 },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    pincode: '',
    address: '',
    regNo: '',
    make: 'Toyota',
    model: 'Innova',
    fuel: 'Petrol'
  });

  const inputRef = useRef(null);

 
  useEffect(() => {
    inputRef.current?.focus();
  }, [flowStatus]);


  useEffect(() => {
    function handleOutsideClick(e) {
      if (!e.target.closest('.rate-tier-container')) {
        setOpenRateTierId(null);
      }
    }
    if (openRateTierId) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [openRateTierId]);


  const handleSearch = (queryStr) => {
    const q = (queryStr || searchTerm).trim();
    if (!q) return;

    setActiveQuery(q);
    const qLower = q.toLowerCase();

    const found = initialCustomers.find(c => 
      c.mobile.toLowerCase().includes(qLower) || 
      c.regNo.toLowerCase().includes(qLower) ||
      c.name.toLowerCase().includes(qLower)
    );

    if (found) {
      setMatchedCustomer(found);
      setFlowStatus('FOUND');
    } else {
      setMatchedCustomer(null);
      setFormData(prev => ({
        ...prev,
        mobile: /^\d+$/.test(q) ? q : prev.mobile,
        regNo: /^[a-zA-Z0-9]+$/.test(q) && !/^\d+$/.test(q) ? q.toUpperCase() : prev.regNo,
      }));
      setFlowStatus('NOT_FOUND');
    }
    setSearchTerm('');
  };

  const handleInputSubmit = (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    handleSearch(searchTerm);
  };

  
  const toggleItemSelect = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

 
  const updatePartCell = (id, field, value) => {
    setEstimateParts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const num = value === '' ? 0 : Number(value);
        return { ...p, [field]: Number.isNaN(num) ? 0 : num };
      })
    );
  };

  const updateLabourCell = (id, field, value) => {
    setEstimateLabour(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const num = value === '' ? 0 : Number(value);
        return { ...l, [field]: Number.isNaN(num) ? 0 : num };
      })
    );
  };

 
  const deletePart = (id) => {
    setEstimateParts(prev => prev.filter(p => p.id !== id));
  };

  const deleteLabour = (id) => {
    setEstimateLabour(prev => prev.filter(l => l.id !== id));
  };

 
  const partsCalculated = estimateParts.map(p => ({ ...p, calc: computeItemTotals(p) }));
  const labourCalculated = estimateLabour.map(l => ({ ...l, calc: computeItemTotals(l) }));

  const partsTotal = partsCalculated.reduce((sum, p) => sum + p.calc.total, 0);
  const labourTotal = labourCalculated.reduce((sum, l) => sum + l.calc.total, 0);
  const partsDiscount = partsCalculated.reduce((sum, p) => sum + p.calc.discAmount, 0);
  const labourDiscount = labourCalculated.reduce((sum, l) => sum + l.calc.discAmount, 0);
  const totalDiscount = partsDiscount + labourDiscount;
  const grandTotal = partsTotal + labourTotal;
  const subTotalBeforeDiscount = partsCalculated.reduce((sum, p) => sum + p.calc.base, 0) + labourCalculated.reduce((sum, l) => sum + l.calc.base, 0);

  const handleAddSelectedItems = () => {
    const selectedParts = [];
    const selectedLabours = [];

    CATALOGUE_ITEMS.filter(it => selectedItemIds.includes(it.id)).forEach(it => {
      if (it.kind === 'Part') {
        selectedParts.push({
          id: it.id,
          code: it.code,
          name: it.name,
          hsn: it.hsn,
          qty: itemQuantities[it.id] ?? it.defaultQty ?? 1,
          rate: itemRates[it.id] ?? it.rate,
          sgst: it.sgst ?? 0,
          cgst: it.cgst ?? 0,
          igst: it.igst ?? 18,
          disc: it.disc ?? 0,
        });
      } else {
        selectedLabours.push({
          id: it.id,
          code: it.code,
          description: it.name,
          hrs: itemQuantities[it.id] ?? it.hrs ?? 1,
          rate: itemRates[it.id] ?? it.rate,
          sgst: it.sgst ?? 0,
          cgst: it.cgst ?? 0,
          igst: it.igst ?? 18,
          disc: it.disc ?? 0,
        });
      }
    });

    if (selectedParts.length > 0) setEstimateParts(selectedParts);
    if (selectedLabours.length > 0) setEstimateLabour(selectedLabours);

    setFlowStatus('ADDED_TABLES');
    showToast.success('Items added to estimate');
  };

 
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.regNo) {
      showToast.error('Please enter Name, Mobile, and Reg.No.');
      return;
    }

    const created = {
      id: `c_${Date.now()}`,
      name: formData.name,
      mobile: formData.mobile,
      pincode: formData.pincode,
      address: formData.address,
      regNo: formData.regNo.toUpperCase(),
      make: formData.make,
      model: formData.model,
      fuel: formData.fuel
    };

    setMatchedCustomer(created);
    setFlowStatus('SELECT_ITEMS');
    showToast.success('Customer added. Now select items for estimate.');
  };

  
  const handleBack = () => {
    if (flowStatus === 'APPROVED') {
      setFlowStatus('SHARED_PENDING');
    } else if (flowStatus === 'SHARED_PENDING') {
      setFlowStatus('SUMMARY_SHARE');
    } else if (flowStatus === 'SUMMARY_SHARE') {
      setFlowStatus('ADDED_TABLES');
    } else if (flowStatus === 'ADDED_TABLES') {
      setFlowStatus('SELECT_ITEMS');
    } else if (flowStatus === 'SELECT_ITEMS') {
      setFlowStatus('FOUND');
    } else if (flowStatus === 'FOUND' || flowStatus === 'NOT_FOUND') {
      setFlowStatus('IDLE');
      setMatchedCustomer(null);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto">
      <div className="space-y-3.5 pt-1">
        {/* Sub-Header with Orange Back Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Orange Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="w-7 h-7 rounded-full bg-[#f4801f] text-white hover:bg-[#dd6710] flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

           
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                New Estimate
              </h3>
              <p className="text-[11px] text-slate-500">
                Create estimation for customer with parts, labour &amp; others.
              </p>
            </div>
          </div>

          
          <div className="text-blue-600 p-1.5 rounded-lg bg-blue-50">
            <Columns2 className="w-4 h-4" />
          </div>
        </div>

       
        {(flowStatus === 'IDLE' || flowStatus === 'FOUND' || flowStatus === 'NOT_FOUND') && (
          <div className="bg-[#f1f5f9] rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal space-y-2.5">
            <div>
              Hi! Enter Mobile No. or Vehicle Reg. No. to find a customer, or add a new customer to create an estimate.
            </div>
            {flowStatus === 'IDLE' && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Quick Select:</span>
                <button
                  type="button"
                  onClick={() => handleSearch('9176177456')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
                >
                  Ajay Kumar (9176177456 - Toyota Innova)
                </button>
              </div>
            )}
          </div>
        )}

       
        {flowStatus === 'FOUND' && matchedCustomer && (
          <div className="space-y-2.5 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results for {activeQuery || matchedCustomer.mobile}
            </h4>

          
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3.5 flex flex-col gap-1 transition-all">
              <span className="font-bold text-slate-900 text-sm">
                {matchedCustomer.name}
              </span>
              <span className="text-xs text-slate-600">
                +91 {matchedCustomer.mobile} • {matchedCustomer.make} {matchedCustomer.model} ({matchedCustomer.regNo})
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFlowStatus('SELECT_ITEMS')}
                className="px-4 py-2 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Estimate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFlowStatus('NOT_FOUND');
                  setFormData(prev => ({
                    ...prev,
                    name: matchedCustomer.name,
                    mobile: matchedCustomer.mobile
                  }));
                }}
                className="px-4 py-2 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Vehicle</span>
              </button>
            </div>
          </div>
        )}

        {flowStatus === 'SELECT_ITEMS' && (
          <div className="space-y-3 pt-1 animate-fadeIn">
            
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3 flex flex-col gap-0.5">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {matchedCustomer?.name ?? 'Ajay Kumar'}
              </span>
              <span className="text-[11px] text-slate-600">
                +91 {matchedCustomer?.mobile ?? '9176177456'} • {matchedCustomer?.make ?? 'Toyota'} {matchedCustomer?.model ?? 'Innova'} ({matchedCustomer?.regNo ?? 'MH12KL2345'})
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Create Estimate by adding the part,labour
            </h4>

            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === cat 
                      ? 'bg-white text-blue-700 font-semibold border border-blue-400 shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

           
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  9 RESULTS
                </span>
                <button
                  type="button"
                  onClick={handleAddSelectedItems}
                  className="px-6 py-1.5 bg-[#f4801f] hover:bg-[#dd6710] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="grid grid-cols-12 text-[11px] font-bold text-slate-500 uppercase px-1 pb-1">
                <span className="col-span-1">#</span>
                <span className="col-span-6">PARTS/LABOUR NAME</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-3 text-right">RATE</span>
              </div>

             
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {CATALOGUE_ITEMS.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const isPart = item.kind === 'Part';
                  const currentQty = itemQuantities[item.id] ?? (isPart ? 1 : (item.hrs ?? 1));
                  const currentRate = itemRates[item.id] ?? item.rate;

                  return (
                    <div 
                      key={item.id}
                      className="grid grid-cols-12 items-center text-xs p-2 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                  
                      <div className="col-span-1 flex items-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleItemSelect(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                    
                      <div className="col-span-6 flex items-center gap-2 min-w-0 pr-2">
                        <span className={`w-5 h-5 shrink-0 rounded-md font-bold text-[10px] flex items-center justify-center ${
                          isPart ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {isPart ? 'P' : 'L'}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-xs truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {isPart ? `${item.code} · HSN: ${item.hsn}` : item.subtext}
                          </div>
                        </div>
                      </div>

                    
                      <div className="col-span-2 flex justify-center">
                        {isPart ? (
                          <div className="relative inline-block">
                            <select
                              value={currentQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setItemQuantities(prev => ({ ...prev, [item.id]: val }));
                              }}
                              className="appearance-none bg-white border border-slate-200 rounded-md pl-2.5 pr-6 py-0.5 text-xs text-slate-800 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                            >
                              {[1, 2, 3, 4, 5, 6, 8, 10].map(q => (
                                <option key={q} value={q}>{q}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            {item.hrs ? `${item.hrs}h` : '—'}
                          </span>
                        )}
                      </div>

                     
                      <div className="col-span-3 text-right">
                        {isPart ? (
                          item.tiers ? (
                            <div className="relative inline-block rate-tier-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRateTierId(openRateTierId === item.id ? null : item.id);
                                }}
                                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md px-2 py-0.5 text-xs text-slate-800 font-medium cursor-pointer"
                              >
                                <span>{item.id === 'p1' ? 'Select' : currentRate.toLocaleString('en-IN')}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              </button>

                              {openRateTierId === item.id && (
                                <div className="absolute right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl p-3 min-w-[210px] text-left animate-fadeIn">
                                  <div className="grid grid-cols-2 text-[11px] font-bold text-slate-600 pb-2 border-b border-slate-100">
                                    <span>Qty</span>
                                    <span className="text-right">Rate</span>
                                  </div>
                                  <div className="space-y-1.5 pt-2">
                                    {item.tiers.map((tier, tIdx) => {
                                      const isSelected = currentRate === tier.rate;
                                      return (
                                        <div
                                          key={tIdx}
                                          onClick={() => {
                                            setItemRates(prev => ({ ...prev, [item.id]: tier.rate }));
                                            setOpenRateTierId(null);
                                          }}
                                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                            isSelected ? 'bg-emerald-50/70 text-slate-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isSelected ? (
                                              <CircleDot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            ) : (
                                              <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                            )}
                                            <span>{tier.qty.toFixed(2)}</span>
                                          </div>
                                          <span className="font-semibold text-slate-900">
                                            {tier.rate.toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <span className="font-semibold text-slate-800 text-xs">
                                ₹{currentRate.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              ₹{currentRate.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.gstLabel || 'GST 18%'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {flowStatus === 'ADDED_TABLES' && (
          <div className="space-y-3.5 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Added Parts and Labour
            </h4>

          
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-[220px]">
                <table className="w-full text-left text-[11px] whitespace-nowrap min-w-[700px]">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">PART NO</th>
                      <th className="py-2.5 px-2 min-w-[140px]">PARTS NAME</th>
                      <th className="py-2.5 px-2">HSN</th>
                      <th className="py-2.5 px-2 text-center">QTY</th>
                      <th className="py-2.5 px-2 text-center">RATE</th>
                      <th className="py-2.5 px-2 text-center">SGST%</th>
                      <th className="py-2.5 px-2 text-center">CGST%</th>
                      <th className="py-2.5 px-2 text-center">IGST%</th>
                      <th className="py-2.5 px-2 text-center">DISC%</th>
                      <th className="py-2.5 px-2 text-right">TOTAL (₹)</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partsCalculated.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                       
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] px-1.5">
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-2 px-2">
                          <span className="inline-block rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] px-2 py-0.5">
                            {p.code}
                          </span>
                        </td>

                      
                        <td className="py-2 px-2 font-bold text-slate-800 text-xs truncate max-w-[160px]">
                          {p.name}
                        </td>

                        
                        <td className="py-2 px-2 text-slate-500 font-medium">
                          {p.hsn}
                        </td>

                        
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={p.qty}
                            onChange={(e) => updatePartCell(p.id, 'qty', e.target.value)}
                            className="w-12 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={p.rate}
                            onChange={(e) => updatePartCell(p.id, 'rate', e.target.value)}
                            className="w-16 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {p.sgst}
                        </td>

                      
                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {p.cgst}
                        </td>

                       
                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {p.igst}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={p.disc}
                            onChange={(e) => updatePartCell(p.id, 'disc', e.target.value)}
                            className="w-12 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                       
                        <td className="py-2 px-2 text-right font-bold text-slate-900 text-xs">
                          {formatINR(p.calc.total)}
                        </td>

                       
                        <td className="py-2 px-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => deletePart(p.id)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                            title="Delete part"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="py-2.5 px-4 bg-slate-50 text-right text-xs font-bold text-blue-600 border-t border-slate-100">
                Parts Total ₹{formatINR(partsTotal)}
              </div>
            </div>

          
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-[180px]">
                <table className="w-full text-left text-[11px] whitespace-nowrap min-w-[700px]">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">CODE</th>
                      <th className="py-2.5 px-2 min-w-[140px]">DESCRIPTION</th>
                      <th className="py-2.5 px-2 text-center">HRS</th>
                      <th className="py-2.5 px-2 text-center">₹/HR</th>
                      <th className="py-2.5 px-2 text-center">SGST%</th>
                      <th className="py-2.5 px-2 text-center">CGST%</th>
                      <th className="py-2.5 px-2 text-center">IGST%</th>
                      <th className="py-2.5 px-2 text-center">DISC%</th>
                      <th className="py-2.5 px-2 text-right">TOTAL (₹)</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labourCalculated.map((l, idx) => (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] px-1.5">
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-2 px-2">
                          <span className="inline-block rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] px-2 py-0.5">
                            {l.code}
                          </span>
                        </td>

                       
                        <td className="py-2 px-2 font-bold text-slate-800 text-xs truncate max-w-[180px]">
                          {l.description}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={l.hrs}
                            onChange={(e) => updateLabourCell(l.id, 'hrs', e.target.value)}
                            className="w-12 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                        
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={l.rate}
                            onChange={(e) => updateLabourCell(l.id, 'rate', e.target.value)}
                            className="w-16 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                       
                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {l.sgst}
                        </td>

                      
                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {l.cgst}
                        </td>

                        <td className="py-2 px-2 text-center text-slate-600 font-medium">
                          {l.igst}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={l.disc}
                            onChange={(e) => updateLabourCell(l.id, 'disc', e.target.value)}
                            className="w-12 h-7 rounded border border-slate-200 text-center text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                        
                        <td className="py-2 px-2 text-right font-bold text-slate-900 text-xs">
                          {formatINR(l.calc.total)}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => deleteLabour(l.id)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                            title="Delete labour"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="py-2.5 px-4 bg-slate-50 text-right text-xs font-bold text-blue-600 border-t border-slate-100">
                Labour Total ₹{formatINR(labourTotal)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">
                    P
                  </span>
                  <div>
                    <span className="text-slate-500 text-[10px] block leading-tight">Parts Total</span>
                    <span className="font-bold text-slate-800 text-xs">₹{formatINR(partsTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center">
                    L
                  </span>
                  <div>
                    <span className="text-slate-500 text-[10px] block leading-tight">Labour Total</span>
                    <span className="font-bold text-slate-800 text-xs">₹{formatINR(labourTotal)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block leading-tight">Sub Total</span>
                  <span className="font-bold text-slate-800 text-xs">₹{formatINR(subTotalBeforeDiscount)}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block leading-tight">Discount</span>
                  <span className="font-bold text-red-500 text-xs">-₹{formatINR(totalDiscount)}</span>
                </div>

             
                <div className="pl-1">
                  <span className="text-slate-500 text-[10px] block leading-tight">Grand Total</span>
                  <span className="font-extrabold text-[#2563eb] text-sm sm:text-base">₹{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFlowStatus('SUMMARY_SHARE')}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                Proceed to Approval
              </button>
            </div>
          </div>
        )}

        {(flowStatus === 'SUMMARY_SHARE' || flowStatus === 'SHARED_PENDING' || flowStatus === 'APPROVED') && (
          <div className="space-y-3.5 pt-1 animate-fadeIn">
           
            <div className="bg-[#f1f5f9] rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              Here's the complete estimate summary for approval.
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Estimate Summary
                </span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  EST-2025-092
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Labour Total</span>
                  <span className="font-semibold text-slate-800">₹{formatINR(labourTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parts Total</span>
                  <span className="font-semibold text-slate-800">₹{formatINR(partsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-semibold text-slate-800">₹{formatINR(subTotalBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-red-500">-₹{formatINR(totalDiscount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-blue-700 text-base font-extrabold">₹{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>

         
            {flowStatus === 'SUMMARY_SHARE' && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    Share Estimate with Customer
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Customer will receive the estimate details and can approve or request changes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFlowStatus('SHARED_PENDING');
                      showToast.success('Estimate shared via WhatsApp');
                    }}
                    className="p-2 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFlowStatus('SHARED_PENDING');
                      showToast.success('Estimate shared via Email');
                    }}
                    className="p-2 rounded-xl border border-blue-500 text-blue-700 hover:bg-blue-50 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Share via Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast.success('Downloading Estimate PDF')}
                    className="p-2 rounded-xl border border-blue-500 text-blue-700 hover:bg-blue-50 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}

            {flowStatus === 'SHARED_PENDING' && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
                <p className="text-xs font-medium text-slate-700">
                  Estimate has been shared to customer for approval
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFlowStatus('APPROVED');
                    showToast.success('Estimate Approved!');
                  }}
                  className="px-4 py-2 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approve Manually</span>
                </button>
              </div>
            )}

            {flowStatus === 'APPROVED' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-emerald-400 bg-emerald-50/50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Estimate has been approved! Ready to create the job card.</span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigate(ROUTES.SERVICE_JOB_CARD)}
                    className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    Create Job Card
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        
        {flowStatus === 'NOT_FOUND' && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results not found “{activeQuery}” Please enter manually
            </h4>

            <form onSubmit={handleAddCustomerSubmit} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2.5 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="Enter Mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Enter Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Enter Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Enter Reg.No."
                  value={formData.regNo}
                  onChange={(e) => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-xs">
                <select
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  {MAKES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  {(MODELS_BY_MAKE[formData.make] || []).map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>

                <select
                  value={formData.fuel}
                  onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  {FUELS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full py-1.5 px-6 rounded-lg bg-[#f4801f] hover:bg-[#dd6710] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Message Input */}
      <form onSubmit={handleInputSubmit} className="pt-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-4 py-2 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 py-1"
            placeholder={flowStatus === 'IDLE' ? 'Enter Mobile No or Vehicle Reg No' : 'Type a message...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="button"
            onClick={() => showToast.success('File attachment feature')}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Attach File"
          >
            <Paperclip className="w-4 h-4 rotate-45" />
          </button>

          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer"
            title="Search or Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

