import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [
        {
            optionText: { type: String, required: true },
            isCorrect: { type: Boolean, default: false }
        }
    ],
    points: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    educatorId: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true,
        default: "Course Quiz"
    },
    description: { 
        type: String,
        default: "Test your knowledge with this quiz"
    },
    questions: [questionSchema],
    totalPoints: { 
        type: Number, 
        default: 0 
    },
    passingScore: { 
        type: Number, 
        default: 60 
    },
    timeLimit: { 
        type: Number, 
        default: 30 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    maxAttempts: { 
        type: Number, 
        default: 1 
    }
}, { 
    timestamps: true 
});

// Calculate total points before saving
quizSchema.pre('save', function(next) {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
    next();
});

export const Quiz = mongoose.model('Quiz', quizSchema);