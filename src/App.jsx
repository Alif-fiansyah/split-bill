import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Users, Receipt, Share2, Check, 
  ExternalLink, RotateCcw, Coins, Copy, CreditCard 
} from 'lucide-react';

export default function App() {
  // Rekening BCA & BRI
  const bankAccounts = [
    { id: 'bca', bank: 'BCA', number: '0092994366', holder: 'Muhammad Rizky Alifiansyah' },
    { id: 'bri', bank: 'BRI', number: '583901011084500', holder: 'Muhammad Rizky Alifiansyah' }
  ];

  const [copiedBank, setCopiedBank] = useState(null);

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('sb_members');
    return saved ? JSON.parse(saved) : ['Alif', 'Rizky'];
  });
  const [newMember, setNewMember] = useState('');

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('sb_items');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Nasi Goreng Spesial', price: 28000, quantity: 1, assignedTo: ['Alif'] },
      { id: 2, name: 'Es Teh Manis', price: 6000, quantity: 2, assignedTo: ['Alif', 'Rizky'] },
    ];
  });
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const [taxPercent, setTaxPercent] = useState(() => Number(localStorage.getItem('sb_tax')) || 10);
  const [servicePercent, setServicePercent] = useState(() => Number(localStorage.getItem('sb_service')) || 0);
  const [discountAmount, setDiscountAmount] = useState(() => Number(localStorage.getItem('sb_discount')) || 0);
  const [roundUp, setRoundUp] = useState(true);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('sb_members', JSON.stringify(members));
    localStorage.setItem('sb_items', JSON.stringify(items));
    localStorage.setItem('sb_tax', taxPercent.toString());
    localStorage.setItem('sb_service', servicePercent.toString());
    localStorage.setItem('sb_discount', discountAmount.toString());
  }, [members, items, taxPercent, servicePercent, discountAmount]);

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
    if (confirm('Yakin ingin mereset semua hitungan patungan?')) {
      setItems([]);
      setDiscountAmount(0);
    }
  };

  const handleCopyNorek = (bankId, number) => {
    navigator.clipboard.writeText(number);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 2000);
  };

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
    const lines = [
      '🧾 *RINCIAN PATUNGAN (SPLIT BILL)*',
      '────────────────────────────',
      ...members.map(m => `👤 *${m}*: Rp ${(memberTotals[m] || 0).toLocaleString('id-ID')}`),
      '────────────────────────────',
      `💰 *Total Tagihan*: Rp ${Math.round(totalBill).toLocaleString('id-ID')}`,
      '',
      '💳 *Transfer Pembayaran ke:*',
      ...bankAccounts.map(b => `• *${b.bank}*: ${b.number} (a/n ${b.holder})`),
      '',
      '_Dihitung via split.lifianzhi.my.id_'
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateMessageText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(generateMessageText());
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 overflow-x-hidden">
      <main className="max-w-2xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 antialiased selection:bg-yellow-300">
        
        {/* Header */}
        <header className="bg-yellow-300 border-2 border-black shadow-neo p-4 sm:p-5 rounded-2xl mb-5 sm:mb-6">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 tracking-tight">
                <Receipt className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" /> SplitBill Pro
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                Kalkulator patungan adil dengan pajak & diskon proporsional.
              </p>
            </div>
            <button
              onClick={handleResetData}
              title="Reset data"
              className="p-2 bg-white border-2 border-black rounded-lg shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        </header>

        {/* Bagian 1: Teman */}
        <section className="bg-white border-2 border-black shadow-neo p-4 sm:p-5 rounded-2xl mb-5 sm:mb-6">
          <h2 className="text-sm sm:text-base font-black flex items-center gap-2 mb-3 tracking-tight">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" /> Siapa yang ikut patungan?
          </h2>
          <form onSubmit={handleAddMember} className="flex gap-2 mb-3.5">
            <input
              type="text"
              placeholder="Nama teman..."
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="flex-1 min-w-0 border-2 border-black px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="bg-black text-white px-3.5 sm:px-5 py-2 rounded-xl font-black text-xs sm:text-sm shadow-neo-sm hover:bg-slate-800 active:translate-x-0.5 active:translate-y-0.5 transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Tambah</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {members.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 bg-emerald-200 border-2 border-black px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black shadow-neo-sm"
              >
                <span className="max-w-[120px] truncate">{name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(name)}
                  className="hover:text-red-600 active:scale-90 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Bagian 2: Item Menu */}
        <section className="bg-white border-2 border-black shadow-neo p-4 sm:p-5 rounded-2xl mb-5 sm:mb-6">
          <h2 className="text-sm sm:text-base font-black mb-3 tracking-tight">Menu & Item Pesanan</h2>
          
          <form onSubmit={handleAddItem} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 mb-4">
            <input
              type="text"
              placeholder="Nama item..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="sm:col-span-5 border-2 border-black px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="number"
              placeholder="Harga (Rp)..."
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="sm:col-span-4 border-2 border-black px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="sm:col-span-3 bg-indigo-600 text-white font-black py-2 rounded-xl text-xs sm:text-sm border-2 border-black shadow-neo-sm hover:bg-indigo-700 active:translate-x-0.5 active:translate-y-0.5 transition"
            >
              + Menu
            </button>
          </form>

          <div className="space-y-3">
            {items.map((item) => {
              const allSelected = item.assignedTo.length === members.length && members.length > 0;
              return (
                <div 
                  key={item.id} 
                  className="border-2 border-black p-3 sm:p-3.5 rounded-xl bg-slate-50 shadow-neo-sm"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 font-bold mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')}
                        <span className="text-slate-400 mx-1">×</span>
                        {item.quantity} = <strong className="text-slate-900">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center border-2 border-black rounded-lg bg-white shadow-neo-sm">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="px-1.5 sm:px-2 py-0.5 text-xs font-black hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="px-1.5 sm:px-2 text-xs font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="px-1.5 sm:px-2 py-0.5 text-xs font-black hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 active:scale-90 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 mr-0.5">Dimakan:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllMembers(item.id)}
                      className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md border-2 border-black font-extrabold transition ${
                        allSelected ? 'bg-indigo-100 text-indigo-900' : 'bg-white text-slate-600'
                      }`}
                    >
                      {allSelected ? '✓ Semua' : 'Semua'}
                    </button>

                    {members.map((m) => {
                      const isChecked = item.assignedTo.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleToggleMember(item.id, m)}
                          className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md border-2 border-black font-black transition-all ${
                            isChecked
                              ? 'bg-amber-300 shadow-neo-sm -translate-y-0.5'
                              : 'bg-white text-slate-400 opacity-60 hover:opacity-100'
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
        </section>

        {/* Bagian 3: Biaya Akhir */}
        <section className="bg-white border-2 border-black shadow-neo p-4 sm:p-5 rounded-2xl mb-5 sm:mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Penyesuaian Biaya Akhir</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3.5">
            <div>
              <label className="text-[11px] sm:text-xs font-bold block mb-1">Pajak / PB1 (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] sm:text-xs font-bold block mb-1">Service Charge (%)</label>
              <input
                type="number"
                value={servicePercent}
                onChange={(e) => setServicePercent(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] sm:text-xs font-bold block mb-1">Diskon Promo (Rp)</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none text-emerald-600"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[11px] sm:text-xs font-bold cursor-pointer select-none bg-yellow-50 p-2.5 rounded-xl border border-black/20">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="w-4 h-4 accent-black rounded cursor-pointer shrink-0"
            />
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bulatkan rupiah ke ratusan terdekat (Rp 100)</span>
          </label>
        </section>

        {/* Bagian 4: Pembayaran & Opsi Transfer BCA & BRI */}
        <section className="bg-white border-2 border-black shadow-neo p-4 sm:p-5 rounded-2xl mb-6">
          <div className="flex justify-between items-center gap-2 mb-3.5">
            <h2 className="text-sm sm:text-base font-black tracking-tight">Rincian Pembayaran</h2>
            <span className="text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-950 px-2 py-1 rounded-md shrink-0">
              Total: Rp {Math.round(totalBill).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {members.map((m) => (
              <div 
                key={m} 
                className="flex justify-between items-center bg-yellow-100/70 border-2 border-black p-2.5 sm:p-3.5 rounded-xl shadow-neo-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black shrink-0"></span>
                  <span className="font-black text-xs sm:text-sm truncate">{m}</span>
                </div>
                <span className="font-black text-xs sm:text-base text-indigo-800 shrink-0 ml-2">
                  Rp {(memberTotals[m] || 0).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {/* Kartu Rekening BCA & BRI */}
          <div className="mb-4 pt-3 border-t-2 border-black/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Transfer Pembayaran (Klik Salin)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bankAccounts.map((account) => {
                const isBca = account.bank === 'BCA';
                const isCopied = copiedBank === account.id;

                return (
                  <div
                    key={account.id}
                    className={`border-2 border-black p-3 rounded-xl shadow-neo-sm flex flex-col justify-between ${
                      isBca ? 'bg-blue-50' : 'bg-cyan-50'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border border-black text-white ${
                          isBca ? 'bg-blue-600' : 'bg-sky-700'
                        }`}>
                          {account.bank}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[130px]" title={account.holder}>
                          a/n {account.holder}
                        </span>
                      </div>
                      <p className="font-mono font-black text-sm text-slate-900 tracking-wider my-1">
                        {account.number}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyNorek(account.id, account.number)}
                      className="mt-2 w-full bg-white hover:bg-slate-100 active:translate-y-0.5 border-2 border-black rounded-lg py-1.5 px-2 text-[11px] font-black flex items-center justify-center gap-1.5 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No. Rekening</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="w-full bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black font-black py-2.5 sm:py-3 rounded-xl shadow-neo active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition text-xs sm:text-sm"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4 stroke-[3]" />}
              {copied ? 'Tersalin!' : 'Salin Rincian ke WA'}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black py-2.5 sm:py-3 rounded-xl shadow-neo active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition text-xs sm:text-sm"
            >
              <ExternalLink className="w-4 h-4 stroke-[3]" /> Buka di WhatsApp
            </button>
          </div>
        </section>

        <footer className="text-center text-[11px] sm:text-xs font-bold text-slate-500 pt-2 pb-4">
          Dibuat oleh <a href="https://lifianzhi.my.id" target="_blank" rel="noreferrer" className="underline text-black">Alifian</a> • lifianzhi.my.id
        </footer>
      </main>
    </div>
  );
}