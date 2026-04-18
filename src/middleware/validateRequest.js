export default function validateRequest(schema) {
    return (req, res, next) => {
        try {
            // 1. Gabungkan body (teks) dan files (gambar/dokumen)
            const dataToValidate = {
                ...req.body
            };

            // Jika pakai upload.single("file")
            if (req.file) {
                dataToValidate.file = req.file;
            }

            // Jika pakai upload.fields([...])
            if (req.files) {
                if (req.files.file) dataToValidate.file = req.files.file[0];
                if (req.files.thumbnail) dataToValidate.thumbnail = req.files.thumbnail[0];
            }

            // 2. Parse data gabungan tersebut
            const parsedData = schema.parse(dataToValidate);

            // 3. (Opsional) Overwrite req.body dengan hasil parse agar tipe data seperti Date/Number otomatis terkonversi
            req.body = parsedData;

            next();
        } catch (err) {
            next(err); // Lempar ke error handler Express bawaanmu
        }
    };
}