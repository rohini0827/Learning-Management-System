import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
    quizId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Quiz', 
        required: true 
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    userId: { 
        type: String, 
        required: true,
        ref: 'User'
    },
    score: { 
        type: Number, 
        required: true 
    },
    totalPoints: { 
        type: Number, 
        required: true 
    },
    percentage: { 
        type: Number, 
        required: true 
    },
    passed: { 
        type: Boolean, 
        required: true 
    },
    attemptNumber: { 
        type: Number, 
        default: 1 
    },
    answers: [{
        questionIndex: { type: Number, required: true },
        selectedOptionIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
        points: { type: Number, required: true }
    }],
    timeSpent: { 
        type: Number, 
        default: 0 
    }, // in seconds
    completedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

// Create compound index for better query performance
quizResultSchema.index({ userId: 1, quizId: 1, attemptNumber: 1 });

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);