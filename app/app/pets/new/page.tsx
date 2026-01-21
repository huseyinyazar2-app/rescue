import PetForm from '@/components/owner/PetForm';
import { requireUser } from '@/lib/auth/requireUser';

export default async function NewPetPage() {
  await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Yeni Pet Ekle</h1>
        <p className="text-slate-300">Pet profilini oluşturun ve isterseniz etiketi bağlayın.</p>
      </header>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <PetForm />
      </section>
    </main>
  );
}
