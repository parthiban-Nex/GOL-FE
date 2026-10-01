import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, 
  ChevronLeft, 
  Columns2, 
  Paperclip, 
  Send, 
  CheckCircle2,
  Phone,
  Car,
  User,
  ArrowRight
} from 'lucide-react';
import { initialCustomers, MAKES, MODELS_BY_MAKE, FUELS } from '@/pages/customers/mockCustomers';
import { ROUTES } from '@/constants/routes';
import { showToast } from '@/utils/toast';

export const QuicklinkCreateCustomer = ({ onBack, onNavigate }) => {
  // Search and Flow status: 'IDLE' | 'FOUND' | 'NOT_FOUND' | 'SUCCESS'
  const [flowStatus, setFlowStatus] = useState('IDLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);

  // Form data for manual entry
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

  // Auto-focus bottom input
  useEffect(() => {
    inputRef.current?.focus();
  }, [flowStatus]);

  // Handle Make change and cascade first Model
  const handleMakeChange = (e) => {
    const make = e.target.value;
    const availableModels = MODELS_BY_MAKE[make] || [];
    setFormData(prev => ({
      ...prev,
      make,
      model: availableModels[0] || ''
    }));
  };

  // Perform search against customer records
  const handleSearch = (queryStr) => {
    const q = (queryStr || searchTerm).trim();
    if (!q) return;

    setActiveQuery(q);
    const qLower = q.toLowerCase();

    // Check against mock customers
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
      // Pre-fill mobile or regNo in form if query matches pattern
      setFormData(prev => ({
        ...prev,
        mobile: /^\d+$/.test(q) ? q : prev.mobile,
        regNo: /^[a-zA-Z0-9]+$/.test(q) && !/^\d+$/.test(q) ? q.toUpperCase() : prev.regNo,
      }));
      setFlowStatus('NOT_FOUND');
    }
    setSearchTerm('');
  };

  // Handle bottom input submit
  const handleInputSubmit = (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    handleSearch(searchTerm);
  };

  // Handle manual customer form addition
  const handleAddSubmit = (e) => {
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
    setFlowStatus('SUCCESS');
    showToast.success('Customer added successfully');
  };

  const availableModels = MODELS_BY_MAKE[formData.make] || ['Innova', 'Fortuner'];

  return (
    <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto">
      <div className="space-y-4 pt-1">
        {/* Sub-Header with Orange Back Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Orange Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-7 h-7 rounded-full bg-[#f4801f] text-white hover:bg-[#dd6710] flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Back to Quick Links"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Icon badge */}
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Create Customer
              </h3>
              <p className="text-[11px] text-slate-500">
                Search existing customers or add a customer &amp; vehicle
              </p>
            </div>
          </div>

          {/* Right Layout Icon */}
          <div className="text-blue-600 p-1.5 rounded-lg bg-blue-50">
            <Columns2 className="w-4 h-4" />
          </div>
        </div>

        {/* Assistant Greeting Bubble */}
        <div className="bg-[#f1f5f9] rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          Hi! Enter Customer Mobile No or Vehicle Reg No to search for existing customer or Can add as a new customer
        </div>

        {/* ==================== STATE 2: SEARCH RESULTS FOUND ==================== */}
        {flowStatus === 'FOUND' && matchedCustomer && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results for {activeQuery}
            </h4>

            {/* Green Bordered Customer Card */}
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3.5 flex flex-col gap-1 transition-all hover:shadow-xs">
              <span className="font-bold text-slate-900 text-sm">
                {matchedCustomer.name}
              </span>
              <span className="text-xs text-slate-600">
                +91 {matchedCustomer.mobile} • {matchedCustomer.make} {matchedCustomer.model} ({matchedCustomer.regNo})
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => onNavigate(ROUTES.SERVICE_ESTIMATE)}
                  className="flex-1 py-1.5 text-center text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  Create Estimate
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(ROUTES.SERVICE_APPOINTMENT)}
                  className="flex-1 py-1.5 text-center text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATE 3: SEARCH NOT FOUND (MANUAL FORM) ==================== */}
        {flowStatus === 'NOT_FOUND' && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results not found “{activeQuery}” Please enter manually
            </h4>

            {/* Manual Form Container */}
            <form onSubmit={handleAddSubmit} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2.5 shadow-xs">
              {/* Row 1: Inputs */}
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

              {/* Row 2: Selects & Add Button */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-xs">
                <select
                  value={formData.make}
                  onChange={handleMakeChange}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="" disabled>Enter Make</option>
                  {MAKES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="" disabled>Enter Model</option>
                  {availableModels.map(mod => (
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

        {/* ==================== STATE 4: SUCCESS STATE ==================== */}
        {flowStatus === 'SUCCESS' && matchedCustomer && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            {/* Green Bordered Customer Card */}
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3.5 flex flex-col gap-1 transition-all">
              <span className="font-bold text-slate-900 text-sm">
                {matchedCustomer.name}
              </span>
              <span className="text-xs text-slate-600">
                +91 {matchedCustomer.mobile} • {matchedCustomer.make} {matchedCustomer.model} ({matchedCustomer.regNo})
              </span>
            </div>

            {/* Green Success Banner */}
            <div className="bg-[#dcfce7] text-[#166534] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              <span>Customer added successfully</span>
            </div>

            {/* Direct Action Options */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onNavigate(ROUTES.SERVICE_ESTIMATE)}
                className="flex-1 py-2 text-center text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              >
                Proceed to Estimate
              </button>
              <button
                type="button"
                onClick={() => onNavigate(ROUTES.SERVICE_APPOINTMENT)}
                className="flex-1 py-2 text-center text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                Book Appointment
              </button>
            </div>
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
