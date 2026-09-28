import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Users, Receipt, Share2, Check, 
  RotateCcw, Coins, CreditCard, ChevronDown, ChevronUp,
  Sparkles, Wallet, UtensilsCrossed, AlertCircle
} from 'lucide-react';

export default function App() {
  // 1. Data Peserta
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('sb_members');
    return saved ? JSON.parse(saved) : [];
  });
  const [newMember, setNewMember] = useState('');

  // 2. Data Menu Pesanan
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('sb_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // 3. Biaya Tambahan
  const [taxPercent, setTaxPercent] = useState(() => Number(localStorage.getItem('sb_tax')) || 10);
  const [servicePercent, setServicePercent] = useState(() => Number(localStorage.getItem('sb_service')) || 0);
  const [discountAmount, setDiscountAmount] = useState(() => Number(localStorage.getItem('sb_discount')) || 0);
  const [roundUp, setRoundUp] = useState(true);

  // 4. Rekening Pembayaran Dinamis (Disimpan di HP masing-masing)
  const [bankName, setBankName] = useState(() => localStorage.getItem('sb_bank_name') || 'BCA');
  const [accNumber, setAccNumber] = useState(() => localStorage.getItem('sb_acc_number') || '');
  const [accHolder, setAccHolder] = useState(() => localStorage.getItem('sb_acc_holder') || '');
  const [showBankForm, setShowBankForm] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('sb_members', JSON.stringify(members));
    localStorage.setItem('sb_items', JSON.stringify(items));
    localStorage.setItem('sb_tax', taxPercent.toString());
    localStorage.setItem('sb_service', servicePercent.toString());
    localStorage.setItem('sb_discount', discountAmount.toString());
    localStorage.setItem('sb_bank_name', bankName);
    localStorage.setItem('sb_acc_number', accNumber);
    localStorage.setItem('sb_acc_holder', accHolder);
  }, [members, items, taxPercent, servicePercent, discountAmount, bankName, accNumber, accHolder]);

  const handleAddMember = (e) => {
    e.preventDefault();
    const clean = newMember.trim();
    if (clean && !members.includes(clean)) {
      setMembers([...members, clean]);
      setNewMember('');
    }
  };

  const handleRemoveMember = (name) => {
    setMembers(members.filter((m) => m !== name));
    setItems(items.map(item => ({
      ...item,
      assignedTo: item.assignedTo.filter(m => m !== name)
    })));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice || members.length === 0) return;
    setItems([
      ...items,
      {
        id: Date.now(),
        name: itemName.trim(),
        price: Math.abs(Number(itemPrice)),
        quantity: Math.max(1, Number(itemQty) || 1),
        assignedTo: [...members],
      },
    ]);
    setItemName('');
    setItemPrice('');
    setItemQty(1);
  };

  const handleUpdateQty = (id, delta) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const newQ = Math.max(1, it.quantity + delta);
      return { ...it, quantity: newQ };
    }));
  };

  const handleToggleMember = (itemId, memberName) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.assignedTo.includes(memberName);
      const updated = exists
        ? item.assignedTo.filter(m => m !== memberName)
        : [...item.assignedTo, memberName];
      return { ...item, assignedTo: updated };
    }));
  };

  const handleSelectAllMembers = (itemId) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const allSelected = item.assignedTo.length === members.length;
      return { ...item, assignedTo: allSelected ? [] : [...members] };
    }));
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleResetData = () => {
    if (confirm('Kosongkan semua pesanan dan nama teman?')) {
      setMembers([]);
      setItems([]);
      setDiscountAmount(0);
      localStorage.removeItem('sb_members');
      localStorage.removeItem('sb_items');
      localStorage.removeItem('sb_discount');
    }
  };

  // Kalkulasi Proporsional
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const memberSubtotals = {};
  members.forEach(m => { memberSubtotals[m] = 0; });

  items.forEach(item => {
    if (item.assignedTo.length > 0) {
      const sharePrice = (item.price * item.quantity) / item.assignedTo.length;
      item.assignedTo.forEach(m => {
        if (memberSubtotals[m] !== undefined) {
          memberSubtotals[m] += sharePrice;
        }
      });
    }
  });

  const taxAmount = (subtotal * Number(taxPercent)) / 100;
  const serviceAmount = (subtotal * Number(servicePercent)) / 100;
  const totalBill = Math.max(0, subtotal + taxAmount + serviceAmount - Number(discountAmount));

  const roundValue = (val) => {
    if (!roundUp) return Math.round(val);
    return Math.ceil(val / 100) * 100;
  };

  const memberTotals = {};
  members.forEach(m => {
    const personSubtotal = memberSubtotals[m] || 0;
    const proportion = subtotal > 0 ? personSubtotal / subtotal : 0;
    const personTax = taxAmount * proportion;
    const personService = serviceAmount * proportion;
    const personDiscount = Number(discountAmount) * proportion;

    const raw = Math.max(0, personSubtotal + personTax + personService - personDiscount);
    memberTotals[m] = roundValue(raw);
  });

  const generateMessageText = () => {
    const paymentLine = accNumber
      ? `\n💳 *Transfer ke:*\n• *${bankName}*: ${accNumber} ${accHolder ? `(a/n ${accHolder})` : ''}`
      : '';

    const lines = [
      '🧾 *RINCIAN PATUNGAN (SPLIT-BILL)*',
      '────────────────────────────',
      ...(members.length > 0 
        ? members.map(m => `👤 *${m}*: Rp ${(memberTotals[m] || 0).toLocaleString('id-ID')}`)
        : ['(Belum ada rincian)']),
      '────────────────────────────',
      `💰 *Total*: Rp ${Math.round(totalBill).toLocaleString('id-ID')}`,
      paymentLine,
      '',
      '_Dihitung otomatis via split.lifianzhi.my.id_'
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = generateMessageText();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMessageText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-neutral-900 pb-12 selection:bg-[#FFE600] selection:text-black">
      <main className="max-w-xl mx-auto px-4 pt-6 sm:pt-10">
        
        {/* Header Retro-Modern */}
        <header className="bg-[#FFE600] border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-black text-[#FFE600] p-1.5 rounded-lg border border-black shadow-[2px_2px_0px_0px_#000]">
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                </span>
                <h1 className="text-2xl font-black tracking-tight font-['Space_Grotesk'] uppercase text-black">
                  SPLIT-BILL
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-bold text-neutral-800">
                Bagi rata, bayar pas, pertemanan aman.
              </p>
            </div>
            
            <button
              onClick={handleResetData}
              title="Reset Semua"
              className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition text-black shrink-0"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* 1. Bagian Peserta */}
        <section className="bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] p-4 sm:p-5 rounded-2xl mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] border border-black"></span>
              Siapa Saja yang Ikut?
            </h2>
            <span className="text-[11px] font-black bg-[#F3F0E6] px-2 py-0.5 rounded-md border border-black/20">
              {members.length} Orang
            </span>
          </div>

          <form onSubmit={handleAddMember} className="flex gap-2 mb-3.5">
            <input
              type="text"
              placeholder="Ketik nama teman..."
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="flex-1 min-w-0 bg-[#FAFAF8] border-2 border-black px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_#000] transition placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="bg-[#6366F1] text-white px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#5254db] active:translate-x-[2px] active:translate-y-[2px] transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Tambah
            </button>
          </form>

          {members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {members.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 bg-[#A7F3D0] border-2 border-black px-3 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="max-w-[120px] truncate">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(name)}
                    className="hover:text-red-600 active:scale-90 transition p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center bg-[#FAF9F5]">
              <p className="text-xs text-neutral-400 font-bold">
                Belum ada orang. Tambahkan nama temanmu di atas.
              </p>
            </div>
          )}
        </section>

        {/* 2. Menu & Pesanan */}
        <section className="bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] p-4 sm:p-5 rounded-2xl mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] border border-black"></span>
              Menu Pesanan
            </h2>
            <span className="text-[11px] font-black bg-[#F3F0E6] px-2 py-0.5 rounded-md border border-black/20">
              {items.length} Item
            </span>
          </div>

          <form onSubmit={handleAddItem} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 mb-4">
            <input
              type="text"
              placeholder="Nama menu (Cth: Nasi Goreng)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="sm:col-span-5 bg-[#FAFAF8] border-2 border-black px-3 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_#000] transition placeholder:text-neutral-400"
            />
            <input
              type="number"
              placeholder="Harga (Rp)"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="sm:col-span-4 bg-[#FAFAF8] border-2 border-black px-3 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_#000] transition placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={members.length === 0}
              className={`sm:col-span-3 font-black py-2 rounded-xl text-xs sm:text-sm border-2 border-black transition ${
                members.length === 0 
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-300' 
                  : 'bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#ebd300] active:translate-x-[2px] active:translate-y-[2px]'
              }`}
            >
              + Masuk Menu
            </button>
          </form>

          {members.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-800 font-bold bg-[#FEF3C7] border-2 border-amber-400/80 rounded-xl p-2.5 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>Masukkan minimal satu nama teman sebelum menambah menu.</span>
            </div>
          )}

          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => {
                const allSelected = item.assignedTo.length === members.length && members.length > 0;
                return (
                  <div 
                    key={item.id} 
                    className="border-2 border-black p-3 sm:p-3.5 rounded-xl bg-[#FAFAF8] shadow-[3px_3px_0px_0px_#000]"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs sm:text-sm text-neutral-900 truncate">{item.name}</h4>
                        <p className="text-[11px] sm:text-xs text-neutral-600 font-bold mt-0.5">
                          Rp {item.price.toLocaleString('id-ID')} × {item.quantity} = <strong className="text-black font-extrabold font-['Space_Grotesk'] text-sm">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="px-2 py-0.5 text-xs font-black hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="px-1.5 text-xs font-black font-['Space_Grotesk']">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="px-2 py-0.5 text-xs font-black hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-neutral-400 hover:text-red-600 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-black/10 flex flex-wrap gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => handleSelectAllMembers(item.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border-2 border-black font-black transition ${
                          allSelected 
                            ? 'bg-black text-white' 
                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {allSelected ? '✓ Semua' : 'Pilih Semua'}
                      </button>

                      {members.map((m) => {
                        const isChecked = item.assignedTo.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleToggleMember(item.id, m)}
                            className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg border-2 border-black font-black transition-all ${
                              isChecked
                                ? 'bg-[#FFE600] shadow-[2px_2px_0px_0px_#000] -translate-y-0.5'
                                : 'bg-white text-neutral-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center bg-[#FAF9F5]">
              <p className="text-xs text-neutral-400 font-bold">
                Belum ada menu yang dimasukkan.
              </p>
            </div>
          )}
        </section>

        {/* 3. Pajak, Diskon & Rekening */}
        <section className="bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] p-4 sm:p-5 rounded-2xl mb-5">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-black"></span>
            Pajak, Servis & Diskon
          </h2>

          <div className="grid grid-cols-3 gap-2.5 mb-3.5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider block mb-1 text-neutral-600">Pajak (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full bg-[#FAFAF8] border-2 border-black px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white font-['Space_Grotesk']"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider block mb-1 text-neutral-600">Servis (%)</label>
              <input
                type="number"
                value={servicePercent}
                onChange={(e) => setServicePercent(e.target.value)}
                className="w-full bg-[#FAFAF8] border-2 border-black px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white font-['Space_Grotesk']"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider block mb-1 text-neutral-600">Diskon (Rp)</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full bg-[#FAFAF8] border-2 border-black px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white text-emerald-600 font-['Space_Grotesk']"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none bg-[#FEFCE8] p-3 rounded-xl border-2 border-black/10 hover:border-black/30 transition mb-3">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="w-4 h-4 accent-black rounded cursor-pointer shrink-0"
            />
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bulatkan ke ratusan terdekat (Rp 100)</span>
          </label>

          {/* Accordion Atur Rekening */}
          <div className="border-t-2 border-black/10 pt-3">
            <button
              type="button"
              onClick={() => setShowBankForm(!showBankForm)}
              className="w-full flex justify-between items-center text-xs font-black text-neutral-800 hover:text-black py-1"
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#6366F1]" />
                {accNumber ? `Rekening Tujuan: ${bankName} • ${accNumber}` : '+ Atur Rekening Pembayaran (Opsional)'}
              </span>
              {showBankForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showBankForm && (
              <div className="mt-3 p-3.5 bg-[#FAF9F5] border-2 border-black rounded-xl space-y-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="col-span-1 border-2 border-black px-2.5 py-2 rounded-xl text-xs font-black bg-white"
                  >
                    <option value="BCA">BCA</option>
                    <option value="BRI">BRI</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">BSI</option>
                    <option value="GoPay">GoPay</option>
                    <option value="DANA">DANA</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="Seabank">Seabank</option>
                    <option value="Bank Jago">Bank Jago</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nomor Rekening / E-Wallet"
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    className="col-span-2 border-2 border-black px-3 py-2 rounded-xl text-xs font-bold bg-white font-['Space_Grotesk']"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Atas Nama (Cth: Alifian)"
                  value={accHolder}
                  onChange={(e) => setAccHolder(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 rounded-xl text-xs font-bold bg-white"
                />
                <p className="text-[10px] text-neutral-500 font-semibold italic">
                  *Tersimpan aman di browsermu tanpa perlu login.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 4. Rincian & Aksi */}
        <section className="bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] p-4 sm:p-5 rounded-2xl mb-6">
          <div className="flex justify-between items-center gap-2 mb-3.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-800">
              Rincian Per Orang
            </h2>
            <div className="bg-[#FFE600] border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_#000]">
              <span className="text-xs font-black font-['Space_Grotesk'] text-black">
                Total: Rp {Math.round(totalBill).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {members.map((m) => (
              <div 
                key={m} 
                className="flex justify-between items-center bg-[#FEFCE8] border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black shrink-0"></span>
                  <span className="font-black text-xs sm:text-sm truncate">{m}</span>
                </div>
                <span className="font-black font-['Space_Grotesk'] text-sm sm:text-base text-neutral-900 shrink-0 ml-2">
                  Rp {(memberTotals[m] || 0).toLocaleString('id-ID')}
                </span>
              </div>
            ))}

            {members.length === 0 && (
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center bg-[#FAF9F5]">
                <p className="text-xs text-neutral-400 font-bold">
                  Belum ada hitungan. Masukkan nama & pesanan terlebih dahulu.
                </p>
              </div>
            )}
          </div>

          {/* Tombol Utama */}
          <div className="space-y-2.5">
            <button
              onClick={handleShareWhatsApp}
              disabled={members.length === 0}
              className={`w-full py-3.5 rounded-xl border-[2.5px] border-black font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                members.length === 0 
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-300' 
                  : 'bg-[#10B981] hover:bg-[#0ea372] text-white shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]'
              }`}
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" /> Bagikan ke WhatsApp
            </button>

            <button
              onClick={handleCopyText}
              disabled={members.length === 0}
              className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-black rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> : null}
              {copied ? 'Teks Berhasil Disalin!' : 'Salin Teks Rincian Saja'}
            </button>
          </div>
        </section>

        {/* Footer */}
      </main>
    </div>
  );
}
