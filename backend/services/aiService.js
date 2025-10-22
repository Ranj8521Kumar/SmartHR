const axios = require('axios');
const natural = require('natural');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Job = require('../models/Job');

// Analyze application with AI
exports.analyzeApplicationAI = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('resume');

    if (!application || !application.resume.isParsed) {
      throw new Error('Resume not parsed');
    }

    const job = application.job;
    const resume = application.resume;

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

    // Overall score (weighted average)
    const overallScore = Math.round(
      (skillsMatch * 0.4) + (experienceMatch * 0.35) + (qualificationMatch * 0.25)
    );

    // Generate analysis text
    const analysis = `Candidate shows ${overallScore >= 70 ? 'strong' : overallScore >= 50 ? 'moderate' : 'limited'} alignment with job requirements. ` +
      `Skills match: ${skillsMatch}%. Experience match: ${experienceMatch}%. Qualification match: ${qualificationMatch}%.`;

    return {
      overallScore,
      skillsMatch,
      experienceMatch,
      qualificationMatch,
      analysis
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      overallScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      qualificationMatch: 0,
      analysis: 'Unable to analyze application'
    };
  }
};

// Match candidate to job
exports.matchCandidateToJob = async (application, job) => {
  try {
    if (!application.resume || !application.resume.isParsed) {
      return {
        overallScore: 0,
        details: 'Resume not parsed'
      };
    }

    const resume = application.resume;

    // Calculate various match scores
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
      (skillsMatch * 0.35) +
      (experienceMatch * 0.30) +
      (qualificationMatch * 0.20) +
      (keywordMatch * 0.15)
    );

    return {
      overallScore,
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
      details: 'Error matching candidate'
    };
  }
};

// Analyze text with external AI API (OpenAI/HuggingFace)
exports.analyzeTextWithAI = async (text, context = 'resume') => {
  try {
    // Check if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      return await analyzeWithOpenAI(text, context);
    } else if (process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your-huggingface-api-key') {
      return await analyzeWithHuggingFace(text, context);
    } else {
      // Fallback to local NLP
      return await analyzeWithLocalNLP(text);
    }
  } catch (error) {
    console.error('AI Text Analysis Error:', error);
    return await analyzeWithLocalNLP(text);
  }
};

// OpenAI integration
const analyzeWithOpenAI = async (text, context) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR analyst specializing in ${context} analysis.`
          },
          {
            role: 'user',
            content: `Analyze this ${context} and extract key information: ${text.substring(0, 2000)}`
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
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
