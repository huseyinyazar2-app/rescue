const PrivacyPage = () => {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Aydınlatma Metni</h1>
        <p className="text-sm text-slate-600">
          MatrixC Rescue güvenliği sağlamak için cihaz bilgileri, tarayıcı dili ve IP adresinizin hashlenmiş
          versiyonunu kısa süreli olarak loglayabilir. Bu bilgiler sadece kötüye kullanım ve güvenlik
          incelemesi amacıyla yöneticiler tarafından görülebilir.
        </p>
        <p className="text-sm text-slate-600">
          Paylaştığınız konum, not ve fotoğraflar sadece kayıp hayvanın sahibine yardımcı olmak için
          kullanılır. Kişisel iletişim bilgileriniz sahibine gösterilmez.
        </p>
      </div>
    </main>
  );
};

export default PrivacyPage;
