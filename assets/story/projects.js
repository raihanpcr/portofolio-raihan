/* Project information from the original portfolio. */
window.PORTFOLIO_PROJECTS = [
                  {
                        name: 'booktopia', title: 'Booktopia', stack: 'Golang · PostgreSQL · Microservice',
                        badge: 'microservice', cat: 'api', img: 'assets/img_project.png',
                        role: 'Backend Developer', feature: 'Auth, Wallet, Gifting, Gateway', size: '12.4K',
                        desc: 'Platform e-commerce buku dengan arsitektur microservice di Golang. Service auth, transaksi, wallet, book, dan gifting berjalan independen dan disatukan lewat API Gateway.',
                        links: [{ label: 'github', url: 'https://github.com/raihanpcr/pojok-baca-api' }], featured: true
                  },
                  {
                        name: 'pojok-baca-api', title: 'Pojok Baca API', stack: 'Echo · PostgreSQL · Midtrans',
                        badge: 'rest-api', cat: 'api', img: 'assets/img_project.png',
                        role: 'Backend Developer', feature: 'Auth, CRUD, Payment', size: '8.1K',
                        desc: 'RESTful API untuk pembelian buku dengan arsitektur monolitik yang modular: autentikasi & otorisasi, manajemen katalog, order, sampai pembayaran lewat Midtrans Snap API.',
                        links: [{ label: 'github', url: 'https://github.com/raihanpcr/pojok-baca-api' }]
                  },
                  {
                        name: 'e-commerce-games', title: 'E-Commerce Games CLI', stack: 'Golang · MySQL',
                        badge: 'cli', cat: 'api', img: 'assets/img_project.png',
                        role: 'Backend Developer', feature: 'Product, Transaction, History', size: '4.7K',
                        desc: 'Aplikasi command-line untuk platform e-commerce game, dibuat saat fase belajar backend di Hacktiv8. Fokus pada struktur kode, persistensi data, dan business logic.',
                        links: [{ label: 'github', url: 'https://github.com/raihanpcr/e-commerce-games' }]
                  },
                  {
                        name: 'jokihan', title: 'Jokihan', stack: 'PHP · Bootstrap · MySQL',
                        badge: 'web-app', cat: 'web', img: 'assets/img_jokihan.PNG',
                        role: 'Fullstack Developer', feature: 'Landing Page, CRUD, Auth', size: '6.3K',
                        desc: 'Aplikasi web penyedia jasa pembuatan website: user bisa mengirim request project dan mengelola interaksi layanan. Fokus pada frontend, input handling, dan integrasi backend.',
                        links: [
                              { label: 'demo', url: 'https://jokihan.netlify.app/' },
                              { label: 'github', url: 'https://github.com/raihanpcr/jokihan' }
                        ]
                  },
                  {
                        name: 'dashboard-sumu', title: 'Dashboard SUMU', stack: 'Laravel · Tailwind · Midtrans',
                        badge: 'dashboard', cat: 'dashboard web', img: 'assets/img_project.png',
                        role: 'Fullstack Developer', feature: 'CRUD, Auth, Payment, WA Verification', size: '15.2K',
                        desc: 'Dashboard real-time berbasis web untuk Serikat Usaha Muhammadiyah (SUMU) yang menampilkan data bisnis dan analitik. Terintegrasi Midtrans dan WhatsApp API untuk notifikasi.',
                        links: []
                  },
                  {
                        name: 'ptbg-pltbg', title: 'PTBg & PLTBg', stack: 'CodeIgniter 3 · Bootstrap · MySQL',
                        badge: 'monitoring', cat: 'web dashboard', img: 'assets/img_biogas.PNG',
                        role: 'Fullstack Developer', feature: 'Admin Control, CRUD, Auth', size: '9.8K',
                        desc: 'Sistem monitoring berbasis web untuk melacak data operasional dan metrik performa pembangkit listrik biogas dan biomassa, dengan visualisasi real-time dan pelaporan.',
                        links: []
                  },
                  {
                        name: 'webgis-dddtlh', title: 'Web GIS DDDTLH', stack: 'CodeIgniter 3 · MySQL · ArcMap',
                        badge: 'gis', cat: 'web dashboard', img: 'assets/img_dddtlh.PNG',
                        role: 'Fullstack Developer', feature: 'GIS, CRUD, Auth', size: '11.5K',
                        desc: 'Geographic Information System untuk memvisualisasikan data Daya Dukung dan Daya Tampung Lingkungan Hidup secara real-time, mendukung analisis spasial lewat peta interaktif.',
                        links: []
                  },
                  {
                        name: 'simoga', title: 'SIMOGA', stack: 'CodeIgniter 3 · Bootstrap · MySQL',
                        badge: 'monitoring', cat: 'web dashboard', img: 'assets/img_simoga.PNG',
                        role: 'Fullstack Developer', feature: 'Admin Dashboard, Monitoring', size: '7.9K',
                        desc: 'Sistem monitoring panen dan pengiriman Tandan Buah Segar (TBS). Data produktivitas divisualisasikan untuk meningkatkan transparansi dan efisiensi rantai pasok.',
                        links: []
                  },
                  {
                        name: 'warehouse-mgmt', title: 'Warehouse Management', stack: 'CodeIgniter 3 · Bootstrap · MySQL',
                        badge: 'dashboard', cat: 'web dashboard', img: 'assets/img_project.png',
                        role: 'Fullstack Developer', feature: 'Admin Control, CRUD, Auth', size: '10.1K',
                        desc: 'Dashboard berbasis web untuk memantau level inventori gudang dan pergerakan stok secara real-time, lengkap dengan pelaporan visual untuk keputusan operasional.',
                        links: []
                  }
            ];
