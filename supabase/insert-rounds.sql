-- ===========================================
-- INSERT ROUNDS DATA FOR ZOOPDAO
-- ===========================================
-- This script inserts the round titles and descriptions
-- based on ZD-169 mapping (Proposal Form Points)
-- ===========================================

-- Option 1: Delete existing data and insert fresh
-- Uncomment the line below if you want to clear existing rounds first
-- DELETE FROM rounds;

-- Insert rounds data
-- Using ON CONFLICT to update if rounds already exist
INSERT INTO rounds (id, index, title, description) VALUES
-- Round 0: Proposal Title
(0, 0, 'Proposal Title', 'Review the proposal title and scenario. Understand the context and purpose of this governance proposal.'),

-- Round 1: Long-term Objective 1
(1, 1, 'Long-term Objective 1', 'Discuss the first long-term objective of the proposal. Share your perspective on how this objective aligns with the organization''s goals.'),

-- Round 2: Long-term Objective 2
(2, 2, 'Long-term Objective 2', 'Discuss the second long-term objective of the proposal. Consider how this objective complements the first and contributes to the overall vision.'),

-- Round 3: Preconditions and Goals
(3, 3, 'Preconditions and Goals', 'Examine the preconditions and requirements needed to achieve the objectives. Discuss what must be in place for the proposal to succeed.'),

-- Round 4: Indicative Steps
(4, 4, 'Indicative Steps', 'Review the initial steps outlined in the proposal. Discuss the practical actions needed to move forward and any concerns or suggestions.'),

-- Round 5: Key Indicators
(5, 5, 'Key Indicators', 'Evaluate the key performance indicators (KPIs) proposed. Discuss whether these indicators effectively measure success and progress.'),

-- Round 6: Functionalities
(6, 6, 'Functionalities', 'Examine the functionalities and features proposed. Discuss how these will be implemented and their impact on operations.'),

-- Round 7: Final Discussion
(7, 7, 'Final Discussion', 'Engage in open discussion about the proposal. Share your final thoughts, concerns, and perspectives before voting.')

ON CONFLICT (id) DO UPDATE SET
    index = EXCLUDED.index,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- Verify the data was inserted correctly
SELECT id, index, title, description FROM rounds ORDER BY index;

