export default function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const dataToValidate = { ...req.body };

            if (req.file) dataToValidate.file = req.file;
            if (req.files) {
                if (req.files.file) dataToValidate.file = req.files.file[0];
                if (req.files.thumbnail) dataToValidate.thumbnail = req.files.thumbnail[0];
            }

            const parsedData = schema.parse(dataToValidate);
            req.body = parsedData;

            next();
        } catch (err) {
            // --- BAGIAN YANG DIPERBAIKI ---
            
            // 1. Jika ini error dari Zod
            if (err.name === 'ZodError') {
                // Kita pakai err.issues (bawaan Zod) dan tanda '?' agar tidak crash kalau kosong
                const errorList = err.issues || err.errors || []; 
                
                return res.status(400).json({
                    success: false,
                    message: "Validasi Form Gagal. Periksa kembali input Anda.",
                    errors: errorList.map((e) => ({
                        field: e.path ? e.path.join('.') : 'unknown',
                        message: e.message
                    }))
                });
            }

            // 2. Jika ini error lain (misal dari Multer atau sistem), PAKSA jadi JSON juga!
            // Jangan pakai next(err) dulu agar Express tidak membalas pakai HTML.
            console.error("Middleware Error:", err); // Munculkan di terminal untuk kita pantau
            
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan sebelum validasi.",
                error: err.message || "Unknown error"
            });
        }
    };
}