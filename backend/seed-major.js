const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const majors = [
    {
      name: 'Teknik Informatika',
      description: `Jurusan yang mempelajari pengembangan perangkat lunak, algoritma, dan sistem komputer. Mencakup pemrograman, kecerdasan buatan, dan jaringan komputer.
Prospek kerja: Software Developer, Data Scientist, AI Engineer, IT Consultant, Cybersecurity Specialist.`
    },
    {
      name: 'Psikologi',
      description: `Mempelajari perilaku manusia dan proses mental, termasuk aspek kognitif, emosional, dan perkembangan individu.
Prospek kerja: Psikolog Klinis, HRD, Konselor, Peneliti Psikologi, Konsultan Organisasi.`
    },
    {
      name: 'Kedokteran',
      description: `Jurusan yang mempersiapkan siswa menjadi dokter dengan mempelajari anatomi, fisiologi, dan praktik medis.
Prospek kerja: Dokter Umum, Dokter Spesialis, Peneliti Medis, Dosen Kedokteran.`
    },
    {
      name: 'Desain Komunikasi Visual',
      description: `Mempelajari desain grafis, ilustrasi, dan komunikasi visual untuk media cetak dan digital.
Prospek kerja: Graphic Designer, Art Director, Illustrator, UI/UX Designer.`
    },
    {
      name: 'Farmasi',
      description: `Mempelajari obat-obatan, komposisi kimia, dan pengaruhnya terhadap tubuh manusia.
Prospek kerja: Apoteker, Peneliti Farmasi, Medical Representative.`
    },
    {
      name: 'Pendidikan',
      description: `Mempersiapkan siswa menjadi pendidik profesional dengan berbagai spesialisasi bidang studi.
Prospek kerja: Guru, Dosen, Konsultan Pendidikan, Pengembang Kurikulum.`
    },
    {
      name: 'Pariwisata',
      description: `Mempelajari manajemen industri pariwisata, termasuk hotel, restoran, dan destinasi wisata.
Prospek kerja: Hotel Manager, Tour Guide, Event Planner, Konsultan Pariwisata.`
    },
    {
      name: 'Arsitektur',
      description: `Mempelajari desain bangunan dan lingkungan binaan yang fungsional dan estetis.
Prospek kerja: Arsitek, Urban Planner, Interior Designer, Konsultan Konstruksi.`
    },
    {
      name: 'Manajemen',
      description: `Mempelajari pengelolaan bisnis dan organisasi untuk mencapai tujuan secara efektif.
Prospek kerja: Manajer, Entrepreneur, Konsultan Bisnis, Marketing Specialist.`
    },
    {
      name: 'Teknik Mesin',
      description: `Mempelajari desain, analisis, dan pemeliharaan sistem mekanik dan mesin.
Prospek kerja: Mechanical Engineer, Maintenance Engineer, Automotive Engineer.`
    },
    {
      name: 'Biologi',
      description: `Mempelajari makhluk hidup dan interaksinya dengan lingkungan.
Prospek kerja: Peneliti Biologi, Konservasionis, Quality Control di Industri Makanan/Farmasi.`
    },
    {
      name: 'Hukum',
      description: `Mempelajari sistem hukum dan penerapannya dalam masyarakat.
Prospek kerja: Pengacara, Hakim, Jaksa, Legal Consultant.`
    },
    {
      name: 'Statistik',
      description: `Mempelajari pengumpulan, analisis, dan interpretasi data.
Prospek kerja: Data Analyst, Statistikawan, Peneliti Pasar, Konsultan Bisnis.`
    },
    {
      name: 'Teknik Elektro',
      description: `Mempelajari sistem kelistrikan, elektronika, dan telekomunikasi.
Prospek kerja: Electrical Engineer, Telecommunication Engineer, Power System Analyst.`
    },
    {
      name: 'Hubungan Internasional',
      description: `Mempelajari hubungan antar negara dan organisasi internasional.
Prospek kerja: Diplomat, International Relations Consultant, NGO Worker.`
    },
    {
      name: 'Sastra Inggris',
      description: `Mempelajari bahasa, sastra, dan budaya Inggris.
Prospek kerja: Penerjemah, Guru Bahasa, Content Writer, Diplomat.`
    },
    {
      name: 'Ilmu Komunikasi',
      description: `Mempelajari proses komunikasi dalam berbagai konteks dan media.
Prospek kerja: Public Relations, Jurnalis, Media Planner, Content Creator.`
    },
    {
      name: 'Akuntansi',
      description: `Mempelajari pencatatan dan analisis transaksi keuangan.
Prospek kerja: Akuntan, Auditor, Financial Analyst, Tax Consultant.`
    },
    {
      name: 'Sistem Informasi',
      description: `Mempelajari integrasi sistem teknologi informasi dengan kebutuhan bisnis.
Prospek kerja: System Analyst, IT Consultant, Database Administrator.`
    },
    {
      name: 'Teknik Sipil',
      description: `Mempelajari perancangan dan konstruksi infrastruktur.
Prospek kerja: Civil Engineer, Structural Engineer, Construction Manager.`
    }
  ];

  for (const major of majors) {
    await prisma.major.upsert({
      where: { name: major.name },
      update: {},
      create: major
    });
  }

  console.log('✅ Major data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });