const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{cb(null,"uploads/inventario");},
    filename:(req,file,cb)=>{const extension = path.extname(file.originalname);
    const nombre = "equipo_"+Date.now()+extension;
    cb(null,nombre);
    }
});
const upload = multer({storage:storage});
module.exports=upload;