import qrcode from "qrcode-generator";
/**
 * Generam un WS pentru a putea comunica cu clientul
 */
const generateQRCodeUrlForWS = () => {
    const URL = process.env.URL_QR_CODE || "http://localhost:3000/qr-code";
    const qr = qrcode(0, "L");
    qr.addData(URL);
    qr.make();
    return qr.createDataURL();
};
export { generateQRCodeUrlForWS };
//# sourceMappingURL=utils.js.map