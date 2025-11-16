import mongoose from 'mongoose';

const certificateRequestSchema = new mongoose.Schema({
    userId: {
        type: String, // Match your User model _id type
        required: true,
        ref: 'User'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    quizResultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizResult'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    certificateUrl: {
        type: String
    },
    certificateId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate unique certificate ID
certificateRequestSchema.pre('save', function(next) {
    if (this.isNew && !this.certificateId) {
        this.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

export default mongoose.model('CertificateRequest', certificateRequestSchema);