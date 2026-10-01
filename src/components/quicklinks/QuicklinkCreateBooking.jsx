import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  Columns2, 
  Paperclip, 
  Send, 
  CheckCircle2, 
  Plus, 
  FileText,
  Clock,
  Car,
  Phone,
  User,
  CalendarCheck
} from 'lucide-react';
import { initialCustomers, MAKES, MODELS_BY_MAKE, FUELS } from '@/pages/customers/mockCustomers';
import { ROUTES } from '@/constants/routes';
import { showToast } from '@/utils/toast';

export const QuicklinkCreateBooking = ({ onBack, onNavigate }) => {

  const [flowStatus, setFlowStatus] = useState('IDLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);

 
  const availableDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayNum = d.getDate();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({
        label: `${dayNum} ${dayName}`,
        dateStr: d.toISOString().slice(0, 10),
        dayNum,
        dayName
      });
    }
    return dates;
  }, []);

  
  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.dateStr || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('9:00 AM - 12:00 PM');
  const [serviceType, setServiceType] = useState('General Service');
  const [pickupNeeded, setPickupNeeded] = useState(false);

 
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
    setFlowStatus('CONFIG');
    showToast.success('Customer added. Now configure booking.');
  };


  
  const handleCreateBookingSubmit = () => {
    if (!selectedDate || !selectedTimeSlot) {
      showToast.error('Please select an appointment date and time.');
      return;
    }

    setFlowStatus('SUCCESS');
    showToast.success('Booking Created Successfully!');
  };

  const handleBack = () => {
    if (flowStatus === 'SUCCESS' || flowStatus === 'CONFIG') {
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
      <div className="space-y-4 pt-1">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
  
            <button
              type="button"
              onClick={handleBack}
              className="w-7 h-7 rounded-full bg-[#f4801f] text-white hover:bg-[#dd6710] flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                2. Create Booking
              </h3>
              <p className="text-[11px] text-slate-500">
                Book appointment for customer &amp; vehicle at your garage.
              </p>
            </div>
          </div>

          {/* Right Layout Icon */}
          <div className="text-blue-600 p-1.5 rounded-lg bg-blue-50">
            <Columns2 className="w-4 h-4" />
          </div>
        </div>

        {/* Assistant Greeting Bubble (visible on initial / search steps) */}
        {(flowStatus === 'IDLE' || flowStatus === 'FOUND' || flowStatus === 'NOT_FOUND') && (
          <div className="bg-[#f1f5f9] rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            Hi! Enter Mobile No. or Vehicle Reg. No. to find a customer, or add a new customer to create an estimate.
          </div>
        )}

      
        {flowStatus === 'FOUND' && matchedCustomer && (
          <div className="space-y-2.5 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results for {activeQuery || matchedCustomer.mobile}
            </h4>

            {/* Green Bordered Customer Card */}
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3.5 flex flex-col gap-1 transition-all">
              <span className="font-bold text-slate-900 text-sm">
                {matchedCustomer.name}
              </span>
              <span className="text-xs text-slate-600">
                +91 {matchedCustomer.mobile} • {matchedCustomer.make} {matchedCustomer.model} ({matchedCustomer.regNo})
              </span>
            </div>

            {/* Two Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFlowStatus('CONFIG')}
                className="px-4 py-2 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Booking</span>
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

        {/* ==================== STEP 4: CREATE BOOKING CONFIGURATION ==================== */}
        {flowStatus === 'CONFIG' && matchedCustomer && (
          <div className="space-y-3.5 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Create Booking for chosen vehicle
            </h4>

            {/* Green Bordered Customer Card */}
            <div className="border border-emerald-400 bg-emerald-50/40 rounded-xl p-3.5 flex flex-col gap-1 transition-all">
              <span className="font-bold text-slate-900 text-sm">
                {matchedCustomer.name}
              </span>
              <span className="text-xs text-slate-600">
                +91 {matchedCustomer.mobile} • {matchedCustomer.make} {matchedCustomer.model} ({matchedCustomer.regNo})
              </span>
            </div>

            {/* Booking Configuration Card */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Left: Date & Time Section */}
                <div className="flex-1 space-y-3">
                  {/* Appointment Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Appointment Date
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableDates.map((item) => {
                        const isSelected = selectedDate === item.dateStr;
                        return (
                          <button
                            key={item.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(item.dateStr)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#f4801f] text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div>{item.dayNum}</div>
                            <div className="text-[10px] uppercase font-normal">{item.dayName}</div>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => showToast.success('Opening date calendar picker')}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#f4801f] cursor-pointer"
                        title="Pick custom date"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Appointment Time */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Appointment Time
                    </label>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {['9:00 AM - 12:00 PM', '12:00 PM - 03:00 PM', '03:00 PM - 06:00 PM'].map((slot) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#f4801f] text-white font-semibold shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Service Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Service Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="General Service">General Service</option>
                      <option value="Periodic Maintenance">Periodic Maintenance</option>
                      <option value="Running Repair">Running Repair</option>
                      <option value="Inspection / Diagnosis">Inspection / Diagnosis</option>
                      <option value="Body & Paint">Body &amp; Paint</option>
                      <option value="Wheel Alignment & Balancing">Wheel Alignment &amp; Balancing</option>
                    </select>
                  </div>
                </div>

                {/* Right: Pickup Toggle */}
                <div className="w-full md:w-36 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Pickup Needed
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${!pickupNeeded ? 'text-slate-900' : 'text-slate-400'}`}>
                      No
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickupNeeded(!pickupNeeded)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        pickupNeeded ? 'bg-[#2563eb]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pickupNeeded ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold ${pickupNeeded ? 'text-slate-900' : 'text-slate-400'}`}>
                      Yes
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCreateBookingSubmit}
                  className="px-6 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  Create Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 5: SUCCESS STATE ==================== */}
        {flowStatus === 'SUCCESS' && matchedCustomer && (
          <div className="space-y-3 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Create Booking for chosen vehicle
            </h4>

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
              <span>Booking Created Successfully</span>
            </div>

            {/* Direct Action Options */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onNavigate(ROUTES.SERVICE_APPOINTMENT)}
                className="flex-1 py-2 text-center text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                View in Appointments
              </button>
              <button
                type="button"
                onClick={() => onNavigate(ROUTES.SERVICE_ESTIMATE)}
                className="flex-1 py-2 text-center text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              >
                Proceed to Estimate
              </button>
            </div>
          </div>
        )}

        {/* ==================== SEARCH NOT FOUND (MANUAL FORM) ==================== */}
        {flowStatus === 'NOT_FOUND' && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <h4 className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
              Search Results not found “{activeQuery}” Please enter manually
            </h4>

            {/* Manual Form Container */}
            <form onSubmit={handleAddSubmit} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2.5 shadow-xs">
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
