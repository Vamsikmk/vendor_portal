// src/pages/Signup.js
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // We'll reuse the same CSS from Login

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, error: authError, loading } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    phone: '',
    gender: '',
    userType: 'customer',
    // Professional fields
    licenseNumber: '',
    specialty: '',
    organization: ''
  });
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle user type change
  const handleUserTypeChange = (e) => {
    setFormData(prevData => ({
      ...prevData,
      userType: e.target.value
    }));
  };

  // Form validation
  const validateForm = () => {
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('First name and last name are required');
      return false;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Email is required');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      setErrorMessage('Password is required');
      return false;
    }

    // Password strength validation
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }

    // Professional fields validation for doctor/HCP
    if ((formData.userType === 'doctor' || formData.userType === 'hcp') && 
        !formData.licenseNumber.trim()) {
      setErrorMessage('License number is required for healthcare professionals');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Handle form submission
  // Replace only the handleSubmit function in your existing Signup.js file

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  try {
    // Map user types to database role values
    const roleMapping = {
      'customer': 'patient',  // Changed from 'customer' to 'patient' to match your DB
      'doctor': 'doctor',
      'hcp': 'hcp'
    };

    // Calculate age from DOB if provided
    let age = null;
    if (formData.dob) {
      const dob = new Date(formData.dob);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      // Adjust age if birthday hasn't occurred yet this year
      if (today.getMonth() < dob.getMonth() || 
          (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Generate username from email if not provided
    const username = formData.email.split('@')[0];

    // Construct the user data object matching your database schema
    const userData = {
      // Required fields
      username: username,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,  // This will be stored in the password column
      // We don't set password_hash here - it will be handled by the backend
      role: roleMapping[formData.userType] || 'patient',
      status: formData.userType === 'customer' ? 'active' : 'pending',
      
      // Optional fields
      age: age,
      gender: formData.gender || null,
      phone: formData.phone || null
    };
    
    // Add professional data if applicable
    if ((formData.userType === 'doctor' || formData.userType === 'hcp') && formData.licenseNumber) {
      userData.professional_data = {
        license_number: formData.licenseNumber
      };
      
      // Only include optional professional fields if they have values
      if (formData.specialty) userData.professional_data.specialty = formData.specialty;
      if (formData.organization) userData.professional_data.organization = formData.organization;
    }
    
    console.log('Submitting user data:', userData);
    
    // Call signup function from auth context
    const result = await signup(userData);
    console.log('Registration result:', result);
    
    // Handle different signup flows based on user type
    if (formData.userType === 'customer') {
      // Redirect to login or dashboard
      navigate('/login', { 
        state: { 
          signupSuccess: true, 
          message: 'Account created successfully! You can now log in.' 
        } 
      });
    } else {
      // Redirect to pending approval page
      navigate('/signup-pending', { 
        state: { 
          userType: formData.userType,
          email: formData.email 
        } 
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    // Extract error message for better user feedback
    let errorMessage = 'Failed to create account. Please try again.';
    
    if (error.response && error.response.data) {
      errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
    } else if (error.detail) {
      errorMessage = error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setErrorMessage(errorMessage);
  }
};

  // Handle next step in multi-step form
  const handleNextStep = (e) => {
    e.preventDefault();
    setCurrentStep(currentStep + 1);
  };

  // Handle previous step in multi-step form
  const handlePrevStep = (e) => {
    e.preventDefault();
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="login-page-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div>Call us at: 1-800-MICROBE | Contact Your Health Advisor</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="main-nav">
        <div className="nav-content">
          <Link to="/" className="logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00BFA5" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            MannBiome
          </Link>
        </div>
      </nav>

      {/* Signup Container */}
      <div className="login-wrapper">
        <div className="login-container" style={{ maxWidth: '600px' }}>
          <h1 className="login-title">Create Your Account</h1>
          
          {/* Progress Steps */}
          <div className="progress-steps" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
            <div className="step-line" style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: '#ddd', zIndex: '0' }}></div>
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`} style={{ 
              background: currentStep >= 1 ? '#00BFA5' : 'white', 
              border: '2px solid #00BFA5', 
              borderRadius: '50%', 
              width: '30px', 
              height: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: currentStep >= 1 ? 'white' : '#00BFA5', 
              fontWeight: 'bold', 
              position: 'relative', 
              zIndex: '1' 
            }}>1</div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`} style={{ 
              background: currentStep >= 2 ? '#00BFA5' : 'white', 
              border: '2px solid #00BFA5', 
              borderRadius: '50%', 
              width: '30px', 
              height: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: currentStep >= 2 ? 'white' : '#00BFA5', 
              fontWeight: 'bold', 
              position: 'relative', 
              zIndex: '1' 
            }}>2</div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`} style={{ 
              background: currentStep >= 3 ? '#00BFA5' : 'white', 
              border: '2px solid #00BFA5', 
              borderRadius: '50%', 
              width: '30px', 
              height: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: currentStep >= 3 ? 'white' : '#00BFA5', 
              fontWeight: 'bold', 
              position: 'relative', 
              zIndex: '1' 
            }}>3</div>
          </div>

          {(errorMessage || authError) && (
            <div className="error-message">
              {errorMessage || authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* User Type Selection */}
                <div className="user-type-selector" style={{ 
                  marginBottom: '25px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  backgroundColor: '#f9f9f9', 
                  gridColumn: '1 / -1' 
                }}>
                  <h3 className="user-type-title" style={{ 
                    marginTop: '0', 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    color: '#2C3E50', 
                    fontWeight: 'bold' 
                  }}>I am a:</h3>
                  <div className="user-type-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="user-type-option" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="radio" 
                        id="customer" 
                        name="userType" 
                        value="customer" 
                        checked={formData.userType === 'customer'}
                        onChange={handleUserTypeChange}
                      />
                      <label htmlFor="customer">Customer/Patient</label>
                    </div>
                    <div className="user-type-option" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="radio" 
                        id="doctor" 
                        name="userType" 
                        value="doctor"
                        checked={formData.userType === 'doctor'}
                        onChange={handleUserTypeChange}
                      />
                      <label htmlFor="doctor">Doctor</label>
                    </div>
                    <div className="user-type-option" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="radio" 
                        id="hcp" 
                        name="userType" 
                        value="hcp"
                        checked={formData.userType === 'hcp'}
                        onChange={handleUserTypeChange}
                      />
                      <label htmlFor="hcp">Healthcare Provider (HCP)</label>
                    </div>
                  </div>
                </div>

                {/* Approval Messages */}
                {formData.userType === 'doctor' && (
                  <div className="approval-message show" style={{ 
                    backgroundColor: '#FFF8E1', 
                    borderLeft: '4px solid #FFC107', 
                    padding: '12px', 
                    marginBottom: '20px', 
                    fontSize: '14px', 
                    gridColumn: '1 / -1' 
                  }}>
                    Note: Doctor accounts require verification before access is granted. We'll need your professional credentials in the next step.
                  </div>
                )}
                
                {formData.userType === 'hcp' && (
                  <div className="approval-message show" style={{ 
                    backgroundColor: '#FFF8E1', 
                    borderLeft: '4px solid #FFC107', 
                    padding: '12px', 
                    marginBottom: '20px', 
                    fontSize: '14px', 
                    gridColumn: '1 / -1' 
                  }}>
                    Note: Healthcare Provider accounts require verification before access is granted. We'll ask for your professional details in the next step.
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName"
                    className="form-input" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName"
                    className="form-input" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <button 
                  type="button" 
                  className="login-button" 
                  onClick={handleNextStep}
                  style={{ gridColumn: '1 / -1' }}
                >
                  Continue
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    className="form-input" 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    className="form-input" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="dob">Date of Birth</label>
                  <input 
                    type="date" 
                    id="dob" 
                    name="dob"
                    className="form-input" 
                    value={formData.dob}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone"
                    className="form-input" 
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select 
                    id="gender" 
                    name="gender"
                    className="form-input" 
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="login-button" 
                    onClick={handlePrevStep}
                    style={{ flex: '1' }}
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    className="login-button" 
                    onClick={handleNextStep}
                    style={{ flex: '1' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Professional Information Fields (shown conditionally) */}
                {(formData.userType === 'doctor' || formData.userType === 'hcp') && (
                  <div className="professional-fields show" style={{ 
                    gridColumn: '1 / -1',
                    backgroundColor: '#f0fdfb',
                    border: '1px solid #00BFA5',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ marginTop: '0', marginBottom: '15px', color: '#2C3E50', fontSize: '16px' }}>Professional Information</h3>
                    <div className="form-group">
                      <label htmlFor="licenseNumber">License Number</label>
                      <input 
                        type="text" 
                        id="licenseNumber" 
                        name="licenseNumber"
                        className="form-input"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        required={formData.userType === 'doctor' || formData.userType === 'hcp'} 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="specialty">Specialty/Position</label>
                      <input 
                        type="text" 
                        id="specialty" 
                        name="specialty"
                        className="form-input"
                        value={formData.specialty}
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="organization">Organization/Practice</label>
                      <input 
                        type="text" 
                        id="organization" 
                        name="organization"
                        className="form-input"
                        value={formData.organization}
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                )}

                <div className="terms" style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  margin: '15px 0',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  By creating an account, you agree to our 
                  <Link to="/terms" style={{ color: '#00BFA5', textDecoration: 'none', marginLeft: '5px' }}>Terms of Service</Link> and 
                  <Link to="/privacy" style={{ color: '#00BFA5', textDecoration: 'none', marginLeft: '5px' }}>Privacy Policy</Link>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="login-button" 
                    onClick={handlePrevStep}
                    style={{ flex: '1' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="login-button"
                    disabled={loading}
                    style={{ flex: '1' }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
              Already have an account? <Link to="/login" style={{ color: '#00BFA5', textDecoration: 'none' }}>Log in</Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-page-footer">
        <div className="footer-content">
          <div className="copyright">
            © {new Date().getFullYear()} MannBiome. All rights reserved.
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/support">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;