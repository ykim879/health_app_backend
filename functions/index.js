const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const fieldsToAnalyze = ['appetite', 'mood', 'bodyCondition', 'stress', 'motivation'];

exports.analyzeDataOnCycleCreation = functions.firestore
    .document('data/{userId}/{startDate}/{cycleNumber}')
    .onCreate(async (snapshot, context) => {
        const { userId, cycleNumber } = context.params;
        const newData = snapshot.data();  // Get the newly created document data

        if (!newData.timestamp) {
            console.error('No timestamp found in the document. Skipping analysis.');
            return;
        }

        const timestamp = newData.timestamp;

        const batch = db.batch();  // Initialize a batch operation

        for (let field of fieldsToAnalyze) {
            if (newData[field] !== undefined) {
                const fieldValue = newData[field];  // Example: appetite: 3

                // Reference to the corresponding analysis document: analysis/{userId}/{cycleNumber}/{field}/{fieldValue}
                const analysisDocRef = db
                    .collection('analysis')
                    .doc(userId)
                    .collection(cycleNumber)
                    .doc(field);  // Storing timestamps in a separate document

                    batch.set(
                        analysisDocRef,
                        { 
                            [fieldValue]: admin.firestore.FieldValue.arrayUnion(timestamp) 
                        }, 
                        { merge: true } // Merge to avoid overwriting the existing array
                    );
                }
            }
    
            // Commit the batch operation to apply all updates atomically
            await batch.commit();
    
            console.log(`Analysis updated for user ${userId}, cycle ${cycleNumber}`);
            return null;
        });