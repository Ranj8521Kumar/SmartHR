const axios = require('axios');
const natural = require('natural');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { parseResume } = require('./resumeParserService');

// Initialize embedder
let embedder = null;
let modelLoading = false;
let pipeline = null;

// Initialize the pipeline
async function initPipeline() {
  try {
    if (!pipeline) {
      const { pipeline: pipelineFunc } = await import('@xenova/transformers');
      pipeline = pipelineFunc;
    }
    return pipeline;
  } catch (error) {
    console.error('Error initializing pipeline:', error);
    return null;
  }
}

async function getEmbedder() {
  try {
    if (!embedder && !modelLoading) {
      modelLoading = true;
      console.log('Loading the embedding model...');
      
      // Dynamically import the transformers package
      const { pipeline: pipelineFunc } = await import('@xenova/transformers');
      pipeline = pipelineFunc;
      
      embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      console.log('Embedding model loaded successfully');
      modelLoading = false;
    } else if (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for model to load
      return getEmbedder();
    }
    return embedder;
  } catch (error) {
    modelLoading = false;
    console.error('Error loading embedding model:', error);
    // Return null instead of throwing to allow fallback
    return null;
  }
}

// Calculate similarity score between resume and job description using embeddings
exports.calculateResumeJobSimilarity = async (resumeText, jobDescription) => {
  try {
    // Now using local embeddings with Xenova transformers, no API key needed

    // Create embeddings for both texts
    const [resumeEmbedding, jobEmbedding] = await Promise.all([
      createEmbedding(resumeText),
      createEmbedding(jobDescription)
    ]);

    // Calculate cosine similarity
    const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);

    // Convert to percentage (0-100)
    const score = Math.round(similarity * 100);

    return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
  } catch (error) {
    console.error('Error calculating resume-job similarity:', error);
    return calculateFallbackSimilarity(resumeText, jobDescription);
  }
};

// Create embedding using Xenova transformers
const createEmbedding = async (text) => {
  try {
    const embedder = await getEmbedder();
    if (!embedder) {
      console.log('Embedder not available, using fallback similarity calculation');
      // Return a simpler vector representation for fallback
      const words = text.toLowerCase().split(/\W+/);
      const vector = new Array(384).fill(0); // Standard embedding size
      for (let i = 0; i < words.length && i < vector.length; i++) {
        vector[i] = words[i].length / 10; // Simple word length normalization
      }
      return vector;
    }
    const output = await embedder(text.substring(0, 8000), { pooling: "mean", normalize: true }); // Limit text length
    return Array.from(output.data);
  } catch (error) {
    console.error('Error creating embedding:', error);
    // Return fallback vector instead of throwing
    return new Array(384).fill(0);
  }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Fallback similarity calculation using TF-IDF and keyword matching
const calculateFallbackSimilarity = (resumeText, jobDescription) => {
  try {
    const tokenizer = new natural.WordTokenizer();
    const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());
    const jobTokens = tokenizer.tokenize(jobDescription.toLowerCase());

    // Remove stop words
    const stopWords = natural.stopwords;
    const filteredResumeTokens = resumeTokens.filter(token => !stopWords.includes(token) && token.length > 2);
    const filteredJobTokens = jobTokens.filter(token => !stopWords.includes(token) && token.length > 2);

    // Calculate TF-IDF similarity
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(filteredResumeTokens.join(' '));
    tfidf.addDocument(filteredJobTokens.join(' '));

    // Get common terms
    const resumeTerms = new Set(filteredResumeTokens);
    const jobTerms = new Set(filteredJobTokens);

    const intersection = new Set([...resumeTerms].filter(x => jobTerms.has(x)));
    const union = new Set([...resumeTerms, ...jobTerms]);

    const jaccardSimilarity = intersection.size / union.size;

    // Also check for exact phrase matches
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    let phraseMatches = 0;
    const phrases = ['years of experience', 'bachelor', 'master', 'phd', 'javascript', 'python', 'react', 'node.js'];

    phrases.forEach(phrase => {
      if (resumeLower.includes(phrase) && jobLower.includes(phrase)) {
        phraseMatches++;
      }
    });

    const phraseScore = (phraseMatches / phrases.length) * 0.3;
    const jaccardScore = jaccardSimilarity * 0.7;

    return Math.round((phraseScore + jaccardScore) * 100);
  } catch (error) {
    console.error('Error in fallback similarity calculation:', error);
    return 50; // Default score
  }
};

// Analyze application with AI
exports.analyzeApplicationAI = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('resume');

    if (!application) {
      throw new Error('Application not found');
    }

    // If resume is not parsed yet, try to parse it here so AI can analyze immediately
    if (!application.resume || !application.resume.isParsed) {
      try {
        const resumeDoc = await Resume.findById(application.resume._id);
        if (!resumeDoc) throw new Error('Resume not found for parsing');

        // Download file from URL (Cloudinary) to temp file if available
        let filePath;
        if (resumeDoc.fileUrl) {
          const response = await axios({
            method: 'get',
            url: resumeDoc.fileUrl,
            responseType: 'arraybuffer'
          });

          const tempDir = os.tmpdir();
          filePath = path.join(tempDir, resumeDoc.fileName);
          await fs.writeFile(filePath, response.data);
        } else {
          // If no fileUrl, cannot parse
          throw new Error('Resume file URL not available');
        }

        // Parse resume and update resume document
        const parsed = await parseResume(filePath, resumeDoc.fileType);

        // Clean up temp file
        if (filePath) {
          await fs.unlink(filePath).catch(() => {});
        }

        resumeDoc.parsedData = parsed.parsedData;
        resumeDoc.aiAnalysis = parsed.aiAnalysis;
        resumeDoc.isParsed = true;
        await resumeDoc.save();

        // Refresh populated resume on application
        application.resume = resumeDoc;
      } catch (parseErr) {
        console.error('Failed to parse resume before AI analysis:', parseErr);
        // continue — analyzeApplicationAI will gracefully handle missing parsed data and return zeros
      }
    }

    const job = application.job;
  const resume = application.resume;

    // Calculate similarity score between resume and job description
    const resumeText = extractResumeText(resume);
    const similarityScore = await exports.calculateResumeJobSimilarity(resumeText, job.description);

    // Calculate skill match
    const skillsMatch = calculateSkillMatch(
      resume.parsedData.skills.map(s => s.name),
      job.skills
    );

    // Calculate experience match
    const experienceMatch = calculateExperienceMatch(
      resume.aiAnalysis.experienceYears,
      job.experienceLevel
    );

    // Calculate qualification match
    const qualificationMatch = calculateQualificationMatch(
      resume.aiAnalysis.educationLevel,
      job.qualifications
    );

    // Calculate matched items
    const matchedSkills = findMatchedSkills(resume.parsedData.skills, job.skills);
    const matchedKeywords = findMatchedKeywords(resumeText, job.description);
    const matchedPhrases = findMatchedPhrases(resumeText, job.description);

    // Overall score (weighted average with similarity as primary factor)
    const overallScore = Math.round(
      (similarityScore * 0.5) + (skillsMatch * 0.25) + (experienceMatch * 0.15) + (qualificationMatch * 0.1)
    );

    // Generate analysis text
    const analysis = `Resume-Job similarity: ${similarityScore}%. Skills match: ${skillsMatch}%. Experience match: ${experienceMatch}%. Qualification match: ${qualificationMatch}%. ` +
      `Overall alignment: ${overallScore >= 70 ? 'Strong' : overallScore >= 50 ? 'Moderate' : 'Limited'} match for this position.`;

    return {
      overallScore,
      similarityScore,
      skillsMatch,
      experienceMatch,
      qualificationMatch,
      analysis,
      matchedSkills,
      matchedKeywords,
      matchedPhrases
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      overallScore: 0,
      similarityScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      qualificationMatch: 0,
      analysis: 'Unable to analyze application'
    };
  }
};

// Extract readable text from resume for similarity calculation
const extractResumeText = (resume) => {
  let text = '';

  // Add summary
  if (resume.parsedData.summary) {
    text += resume.parsedData.summary + ' ';
  }

  // Add skills
  if (resume.parsedData.skills && resume.parsedData.skills.length > 0) {
    text += 'Skills: ' + resume.parsedData.skills.map(s => s.name).join(', ') + ' ';
  }

  // Add experience
  if (resume.parsedData.experience && resume.parsedData.experience.length > 0) {
    text += 'Experience: ';
    resume.parsedData.experience.forEach(exp => {
      text += `${exp.position} at ${exp.company}: ${exp.description} `;
    });
  }

  // Add education
  if (resume.parsedData.education && resume.parsedData.education.length > 0) {
    text += 'Education: ';
    resume.parsedData.education.forEach(edu => {
      text += `${edu.degree} in ${edu.field} from ${edu.institution} `;
    });
  }

  // Add projects
  if (resume.parsedData.projects && resume.parsedData.projects.length > 0) {
    text += 'Projects: ';
    resume.parsedData.projects.forEach(proj => {
      text += `${proj.name}: ${proj.description} Technologies: ${proj.technologies.join(', ')} `;
    });
  }

  return text.trim();
};

// Match candidate to job
exports.matchCandidateToJob = async (application, job) => {
  try {
    // If resume isn't parsed yet, attempt to parse it so matching can proceed
    if (!application.resume || !application.resume.isParsed) {
      try {
        const resumeDoc = await Resume.findById(application.resume._id);
        if (resumeDoc && resumeDoc.fileUrl) {
          const response = await axios({
            method: 'get',
            url: resumeDoc.fileUrl,
            responseType: 'arraybuffer'
          });

          const tempDir = os.tmpdir();
          const filePath = path.join(tempDir, resumeDoc.fileName);
          await fs.writeFile(filePath, response.data);

          const parsed = await parseResume(filePath, resumeDoc.fileType);
          await fs.unlink(filePath).catch(() => {});

          resumeDoc.parsedData = parsed.parsedData;
          resumeDoc.aiAnalysis = parsed.aiAnalysis;
          resumeDoc.isParsed = true;
          await resumeDoc.save();

          application.resume = resumeDoc;
        }
      } catch (err) {
        console.error('Failed to parse resume in matchCandidateToJob:', err);
        return {
          overallScore: 0,
          details: 'Resume not parsed'
        };
      }
    }

    const resume = application.resume;

    // Calculate similarity score
    const resumeText = extractResumeText(resume);
    const similarityScore = await exports.calculateResumeJobSimilarity(resumeText, job.description);

    // Calculate skill match
    const skillsMatch = calculateSkillMatch(
      resume.parsedData.skills.map(s => s.name),
      job.skills
    );

    const experienceMatch = calculateExperienceMatch(
      resume.aiAnalysis.experienceYears,
      job.experienceLevel
    );

    const qualificationMatch = calculateQualificationMatch(
      resume.aiAnalysis.educationLevel,
      job.qualifications
    );

    // Calculate keyword match
    const keywordMatch = calculateKeywordMatch(
      resume.aiAnalysis.keywords,
      job.description + ' ' + job.responsibilities.join(' ')
    );

    // Weighted overall score
    const overallScore = Math.round(
      (similarityScore * 0.4) +
      (skillsMatch * 0.25) +
      (experienceMatch * 0.15) +
      (qualificationMatch * 0.1) +
      (keywordMatch * 0.1)
    );

    return {
      overallScore,
      similarityScore,
      skillsMatch,
      experienceMatch,
      qualificationMatch,
      keywordMatch,
      recommendation: overallScore >= 70 ? 'Highly Recommended' :
                     overallScore >= 50 ? 'Recommended' :
                     overallScore >= 30 ? 'Consider' : 'Not Recommended'
    };
  } catch (error) {
    console.error('Candidate Matching Error:', error);
    return {
      overallScore: 0,
      similarityScore: 0,
      details: 'Error matching candidate'
    };
  }
};

// Analyze text with local AI model
exports.analyzeTextWithAI = async (text, context = 'resume') => {
  try {
    // Using local NLP analysis since we're using local models
    return await analyzeWithLocalNLP(text);
  } catch (error) {
    console.error('AI Text Analysis Error:', error);
    return await analyzeWithLocalNLP(text);
  }
};



// HuggingFace integration
const analyzeWithHuggingFace = async (text, context) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        inputs: text.substring(0, 1000)
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('HuggingFace API Error:', error);
    throw error;
  }
};

// Local NLP analysis (fallback)
const analyzeWithLocalNLP = async (text) => {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());

  // Sentiment analysis
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const sentiment = analyzer.getSentiment(tokens);

  return {
    sentiment,
    tokens: tokens.slice(0, 50),
    length: text.length,
    wordCount: tokens.length
  };
};

// Helper: Calculate skill match percentage
const calculateSkillMatch = (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 50;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  let matchCount = 0;
  jobSkillsLower.forEach(jobSkill => {
    if (candidateSkillsLower.some(cs => cs.includes(jobSkill) || jobSkill.includes(cs))) {
      matchCount++;
    }
  });

  return Math.round((matchCount / jobSkillsLower.length) * 100);
};

// Helper: Calculate experience match
const calculateExperienceMatch = (candidateYears, jobLevel) => {
  const experienceLevels = {
    'Entry Level': 0,
    'Mid Level': 3,
    'Senior Level': 6,
    'Lead': 8,
    'Manager': 10
  };

  const requiredYears = experienceLevels[jobLevel] || 0;

  if (candidateYears >= requiredYears + 2) return 100;
  if (candidateYears >= requiredYears) return 90;
  if (candidateYears >= requiredYears - 1) return 70;
  if (candidateYears >= requiredYears - 2) return 50;
  return 30;
};

// Helper: Calculate qualification match
const calculateQualificationMatch = (candidateEducation, jobQualifications) => {
  if (!jobQualifications || jobQualifications.length === 0) return 50;

  const educationLevels = {
    'High School': 1,
    "Bachelor's Degree": 2,
    "Master's Degree": 3,
    'PhD': 4
  };

  const candidateLevel = educationLevels[candidateEducation] || 1;
  const qualificationsText = jobQualifications.join(' ').toLowerCase();

  if (qualificationsText.includes('phd') || qualificationsText.includes('doctorate')) {
    return candidateLevel >= 4 ? 100 : candidateLevel >= 3 ? 70 : 40;
  }
  if (qualificationsText.includes('master')) {
    return candidateLevel >= 3 ? 100 : candidateLevel >= 2 ? 80 : 50;
  }
  if (qualificationsText.includes('bachelor')) {
    return candidateLevel >= 2 ? 100 : candidateLevel >= 1 ? 60 : 30;
  }

  return 70; // Default if no specific education requirement
};

// Helper: Calculate keyword match
const calculateKeywordMatch = (candidateKeywords, jobDescription) => {
  if (!candidateKeywords || candidateKeywords.length === 0) return 0;

  const jobDescLower = jobDescription.toLowerCase();
  let matchCount = 0;

  candidateKeywords.forEach(keyword => {
    if (jobDescLower.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  });

  return Math.min(Math.round((matchCount / candidateKeywords.length) * 100), 100);
};

// Helper: Find matched skills
const findMatchedSkills = (candidateSkills, jobSkills) => {
  if (!candidateSkills || !jobSkills) return [];

  const matched = [];
  const candidateSkillsLower = candidateSkills.map(s => s.name.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

  jobSkillsLower.forEach(jobSkill => {
    const match = candidateSkillsLower.find(cs => cs.includes(jobSkill) || jobSkill.includes(cs));
    if (match) {
      const originalSkill = candidateSkills.find(s => s.name.toLowerCase() === match);
      matched.push({
        skill: originalSkill ? originalSkill.name : match,
        confidence: 90 // High confidence for direct matches
      });
    }
  });

  return matched;
};

// Helper: Find matched keywords
const findMatchedKeywords = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return [];

  const tokenizer = new natural.WordTokenizer();
  const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());
  const jobTokens = tokenizer.tokenize(jobDescription.toLowerCase());

  const stopWords = natural.stopwords;
  const filteredResumeTokens = resumeTokens.filter(token => !stopWords.includes(token) && token.length > 2);
  const filteredJobTokens = jobTokens.filter(token => !stopWords.includes(token) && token.length > 2);

  const resumeTerms = new Set(filteredResumeTokens);
  const jobTerms = new Set(filteredJobTokens);

  const intersection = [...resumeTerms].filter(x => jobTerms.has(x));

  return intersection.slice(0, 10).map(keyword => ({
    keyword,
    context: `Found in both resume and job description`
  }));
};

// Helper: Find matched phrases
const findMatchedPhrases = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return [];

  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  const phrases = [
    'years of experience', 'bachelor', 'master', 'phd', 'javascript', 'python', 'react', 'node.js',
    'team player', 'problem solving', 'communication skills', 'leadership', 'project management'
  ];

  const matched = [];
  phrases.forEach(phrase => {
    if (resumeLower.includes(phrase) && jobLower.includes(phrase)) {
      matched.push({
        phrase,
        source: 'Both resume and job description'
      });
    }
  });

  return matched;
};

// Initialize AI model
exports.initAIModel = async () => {
  try {
    await getEmbedder();
    console.log('AI model initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI model:', error);
  }
};

// Export all functions
module.exports = {
  calculateResumeJobSimilarity: exports.calculateResumeJobSimilarity,
  analyzeApplicationAI: exports.analyzeApplicationAI,
  matchCandidateToJob: exports.matchCandidateToJob,
  analyzeTextWithAI: exports.analyzeTextWithAI,
  initAIModel: exports.initAIModel
};
