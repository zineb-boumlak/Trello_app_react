const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Le nom est obligatoire.'], 
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'L\'email est obligatoire.'], 
        unique: true, 
        trim: true,
        lowercase: true, 
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide.'] 
    },
    password: { 
        type: String, 
        required: [true, 'Le mot de passe est obligatoire.'], 
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères.'] 
    }
}, { timestamps: true }); 

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); 
    try {
        const salt = await bcrypt.genSalt(10); 
        this.password = await bcrypt.hash(this.password, salt); 
    } catch (err) {
        next(err);
    }
});

UserSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password); 
    } catch (err) {
        throw new Error('Erreur lors de la comparaison des mots de passe.');
    }
};

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;