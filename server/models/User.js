const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto'); // Ajouté pour les méthodes crypto

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Le nom est obligatoire.'], 
        trim: true,
        maxlength: [50, 'Le nom ne peut excéder 50 caractères.']
    },
    email: { 
        type: String, 
        required: [true, 'L\'email est obligatoire.'], 
        unique: true, 
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Veuillez entrer un email valide.'
        }
    },
    password: { 
        type: String, 
        required: [true, 'Le mot de passe est obligatoire.'], 
        minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

// Middleware pour le hachage du mot de passe
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        
        if (!this.isNew) {
            this.passwordChangedAt = Date.now() - 1000;
        }
    } catch (err) {
        next(err);
    }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour vérifier si le mot de passe a été changé après l'émission du JWT
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Méthode pour générer un token de réinitialisation
UserSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);