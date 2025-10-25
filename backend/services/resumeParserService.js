const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const natural = require('natural');
const { analyzeTextWithAI } = require('./aiService');

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse resume based on file type
exports.parseResume = async (filePath, fileType) => {
  let text = '';

  try {
    if (fileType === 'pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (fileType === 'doc') {
      // For older .doc files, fallback to basic text extraction
      const dataBuffer = await fs.readFile(filePath);
      text = dataBuffer.toString('utf8');
    }

    // Parse the extracted text
    const parsedData = await parseResumeText(text);
    
    // AI analysis
    const aiAnalysis = await analyzeResumeWithAI(text, parsedData);

    return {
      parsedData,
      aiAnalysis
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume');
  }
};

// Parse resume text and extract structured data
const parseResumeText = async (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const parsedData = {
    personalInfo: extractPersonalInfo(text),
    summary: extractSummary(text),
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    certifications: extractCertifications(text),
    projects: extractProjects(text),
    languages: extractLanguages(text),
    awards: extractAwards(text)
  };

  return parsedData;
};

// Extract personal information
const extractPersonalInfo = (text) => {
  const personalInfo = {};

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    personalInfo.email = emailMatch[0];
  }

  // Extract phone
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    personalInfo.phone = phoneMatch[0];
  }

  // Extract LinkedIn
  const linkedInRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/;
  const linkedInMatch = text.match(linkedInRegex);
  if (linkedInMatch) {
    personalInfo.linkedIn = 'https://' + linkedInMatch[0];
  }

  // Extract GitHub
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    personalInfo.github = 'https://' + githubMatch[0];
  }

  // Extract name (usually first few lines)
  const nameRegex = /^[A-Z][a-z]+\s+[A-Z][a-z]+/m;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    personalInfo.name = nameMatch[0];
  }

  return personalInfo;
};

// Extract summary/objective
const extractSummary = (text) => {
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Get next 3-5 lines as summary
      let summary = '';
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (lines[j].trim().length > 20) {
          summary += lines[j].trim() + ' ';
        }
      }
      return summary.trim();
    }
  }
  
  return '';
};

// Extract skills
const extractSkills = (text) => {
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'expertise', 'competencies']);
  const skills = [];

  if (skillsSection) {
    // Common tech skills database
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Angular', 'Vue',
      'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'Machine Learning', 'AI', 'Data Science', 'HTML', 'CSS', 'TypeScript',
      'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'DevOps', 'CI/CD'
    ];

    commonSkills.forEach(skill => {
      if (new RegExp(escapeRegExp(skill), 'i').test(skillsSection)) {
        skills.push({
          name: skill,
          category: categorizeSkill(skill),
          proficiency: 'Not specified'
        });
      }
    });
  }

  return skills;
};

// Extract work experience
const extractExperience = (text) => {
  const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'work history']);
  const experiences = [];

  if (experienceSection) {
    // Parse experience entries (simplified)
    const lines = experienceSection.split('\n');
    let currentExp = null;

    for (const line of lines) {
      // Look for job titles and companies
      if (line.length > 10 && line.length < 100) {
        if (currentExp) {
          experiences.push(currentExp);
        }
        currentExp = {
          company: '',
          position: line.trim(),
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          responsibilities: []
        };
      } else if (currentExp && line.startsWith('•') || line.startsWith('-')) {
        currentExp.responsibilities.push(line.substring(1).trim());
      }
    }

    if (currentExp) {
      experiences.push(currentExp);
    }
  }

  return experiences;
};

// Extract education
const extractEducation = (text) => {
  const educationSection = extractSection(text, ['education', 'academic', 'qualification']);
  const education = [];

  if (educationSection) {
    const degreeKeywords = ['bachelor', 'master', 'phd', 'associate', 'diploma', 'certificate', 'b.s.', 'm.s.', 'b.a.', 'm.a.'];
    const lines = educationSection.split('\n');

    for (const line of lines) {
      if (degreeKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        education.push({
          institution: '',
          degree: line.trim(),
          field: '',
          startDate: '',
          endDate: '',
          gpa: '',
          description: ''
        });
      }
    }
  }

  return education;
};

// Extract certifications
const extractCertifications = (text) => {
  const certsSection = extractSection(text, ['certifications', 'certificates', 'licenses']);
  const certifications = [];

  if (certsSection) {
    const lines = certsSection.split('\n');
    for (const line of lines) {
      if (line.trim().length > 5) {
        certifications.push({
          name: line.trim(),
          issuer: '',
          date: '',
          expiryDate: '',
          credentialId: ''
        });
      }
    }
  }

  return certifications;
};

// Extract projects
const extractProjects = (text) => {
  const projectsSection = extractSection(text, ['projects', 'personal projects', 'portfolio']);
  const projects = [];

  if (projectsSection) {
    const lines = projectsSection.split('\n');
    for (const line of lines) {
      if (line.trim().length > 10) {
        projects.push({
          name: line.trim(),
          description: '',
          technologies: [],
          url: '',
          startDate: '',
          endDate: ''
        });
      }
    }
  }

  return projects;
};

// Extract languages
const extractLanguages = (text) => {
  const languagesSection = extractSection(text, ['languages', 'language skills']);
  const languages = [];

  if (languagesSection) {
    const commonLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Arabic'];
    commonLanguages.forEach(lang => {
      if (new RegExp(escapeRegExp(lang), 'i').test(languagesSection)) {
        languages.push({
          name: lang,
          proficiency: 'Not specified'
        });
      }
    });
  }

  return languages;
};

// Extract awards
const extractAwards = (text) => {
  const awardsSection = extractSection(text, ['awards', 'honors', 'achievements']);
  const awards = [];

  if (awardsSection) {
    const lines = awardsSection.split('\n');
    for (const line of lines) {
      if (line.trim().length > 5) {
        awards.push({
          title: line.trim(),
          issuer: '',
          date: '',
          description: ''
        });
      }
    }
  }

  return awards;
};

// Helper function to extract section by keywords
const extractSection = (text, keywords) => {
  const lines = text.split('\n');
  let sectionStart = -1;
  let sectionEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    if (sectionStart === -1 && keywords.some(keyword => line === keyword || line.startsWith(keyword))) {
      sectionStart = i + 1;
    } else if (sectionStart !== -1 && line.length > 0 && line.match(/^[a-z\s]+$/i) && line.length < 30) {
      // Likely a new section header
      sectionEnd = i;
      break;
    }
  }

  if (sectionStart !== -1) {
    sectionEnd = sectionEnd === -1 ? lines.length : sectionEnd;
    return lines.slice(sectionStart, sectionEnd).join('\n');
  }

  return null;
};

// Categorize skill
const categorizeSkill = (skill) => {
  const categories = {
    'Programming Languages': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust'],
    'Frontend': ['React', 'Angular', 'Vue', 'HTML', 'CSS'],
    'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring'],
    'Database': ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
    'Cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
    'Data Science': ['Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch']
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.includes(skill)) {
      return category;
    }
  }

  return 'Other';
};

// AI-powered resume analysis
const analyzeResumeWithAI = async (text, parsedData) => {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());

  // Extract keywords using TF-IDF
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const keywords = [];
  tfidf.listTerms(0).slice(0, 20).forEach(item => {
    keywords.push(item.term);
  });

  // Calculate experience years (simplified)
  const experienceYears = parsedData.experience.length * 2; // Rough estimate

  // Determine education level
  let educationLevel = 'High School';
  if (text.toLowerCase().includes('bachelor') || text.toLowerCase().includes('b.s.') || text.toLowerCase().includes('b.a.')) {
    educationLevel = "Bachelor's Degree";
  }
  if (text.toLowerCase().includes('master') || text.toLowerCase().includes('m.s.') || text.toLowerCase().includes('m.a.')) {
    educationLevel = "Master's Degree";
  }
  if (text.toLowerCase().includes('phd') || text.toLowerCase().includes('doctorate')) {
    educationLevel = 'PhD';
  }

  // Industry focus
  const industryKeywords = {
    'Technology': ['software', 'developer', 'engineer', 'programming', 'tech'],
    'Finance': ['finance', 'accounting', 'banking', 'investment'],
    'Healthcare': ['healthcare', 'medical', 'nurse', 'doctor', 'patient'],
    'Marketing': ['marketing', 'sales', 'advertising', 'brand'],
    'Education': ['education', 'teaching', 'teacher', 'professor']
  };

  const industryFocus = [];
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      industryFocus.push(industry);
    }
  }

  // Calculate overall score
  let score = 50; // Base score
  if (parsedData.skills.length > 5) score += 10;
  if (parsedData.experience.length > 2) score += 15;
  if (parsedData.education.length > 0) score += 10;
  if (parsedData.certifications.length > 0) score += 10;
  if (parsedData.projects.length > 0) score += 5;

  return {
    keywords,
    skillsExtracted: parsedData.skills.map(s => s.name),
    experienceYears,
    educationLevel,
    industryFocus,
    strengths: [
      parsedData.skills.length > 5 ? 'Strong technical skills' : null,
      parsedData.experience.length > 2 ? 'Extensive experience' : null,
      parsedData.certifications.length > 0 ? 'Professional certifications' : null
    ].filter(Boolean),
    suggestions: [
      parsedData.skills.length < 5 ? 'Add more relevant skills' : null,
      !parsedData.personalInfo.linkedIn ? 'Add LinkedIn profile' : null,
      parsedData.projects.length === 0 ? 'Include personal projects' : null
    ].filter(Boolean),
    overallScore: Math.min(score, 100)
  };
};
