import express from 'express';

export const reverseTranslatorsRouter = express.Router();

reverseTranslatorsRouter.post('/reverse-qt', async (req, res) => {
    try {
        const qtOutput = req.body; // Expected type: { qtype: string , goal: string , existing: string }
        
        // Mock response - in reality this would involve LLM processing
        const originalQuestion = reverseQt(qtOutput);
        
        res.status(200).send({ 
            data: {
                originalQuestion: originalQuestion,
                qtOutput: qtOutput
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

reverseTranslatorsRouter.post('/reverse-gt', async (req, res) => {
    try {
        const gtOutput = req.body; // Expected type: { formula: string, shortname: string }
        const originalGoal = reverseGt(gtOutput);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
})


function reverseQt(qtOutput: { qtype: string, goal: string, existing: string }) {
    
    // TODO: Assert that the qtype is in the list of valid qtypes

    let outputString = "I understood your question as: ";
    if (qtOutput.qtype === "US-WHY") {
        outputString += "Why is the task unsolvable? ";
    } else if (qtOutput.qtype === "US-HOW") {
        outputString += "How can I make the task solvable? ";
    } else if (qtOutput.qtype === "S-WHY-NOT") {
        outputString += "Why is " + qtOutput.goal + " not satisfied?";
    } else if (qtOutput.qtype === "S-HOW") {
        outputString += "How can " + qtOutput.goal + " be satisfied?";
    } else if (qtOutput.qtype === "S-WHAT-IF") {
        outputString += "What happens if I enforce " + qtOutput.goal + "?";
    } else if (qtOutput.qtype === "S-CAN") {
        outputString += "Can " + qtOutput.goal + " be satisfied?";
    } else {
        return "UNRECOGNIZED QUESTION TYPE";
    }
    return outputString;
}

function reverseGt(gtOutput: { formula: string, shortname: string }) {
    let outputString = "I understood this goal as: ";

    // TODO: Implement the LLM call  to reverse the goal translator output

    
    return outputString + gtOutput.shortname + " = " + gtOutput.formula;
}