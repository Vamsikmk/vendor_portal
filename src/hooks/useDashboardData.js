// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import dashboardApi from '../services/apiService';

// Custom hook to fetch dashboard data
function useDashboardData(dateRangeParams) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch data from multiple endpoints in parallel for better performance
        const [
          metricsData,
          customerInsightsData,
          recentCustomersData
        ] = await Promise.all([
          dashboardApi.getDashboardMetrics(),
          dashboardApi.getCustomerInsights(),
          dashboardApi.getRecentCustomers()
        ]);
        
        // Compile all the data together to match your existing dashboard structure
        const dashboardData = {
          stats: {
            totalImpressions: metricsData.total_impressions || 0,
            engagementRate: metricsData.engagement_rate || 0,
            customerReach: metricsData.customer_reach || 0,
            averageRating: 4.7, // Using static value since not available in API
            impressionChange: 18.7, // Using static value since not available in API
            engagementChange: 2.1, // Using static value since not available in API
            reachChange: 12.5, // Using static value since not available in API
            ratingChange: 0.2 // Using static value since not available in API
          },
          customerInsights: {
            totalCustomers: customerInsightsData.total_customers || 0,
            newCustomers: customerInsightsData.new_customers || 0,
            avgHealthIndex: customerInsightsData.avg_health_index || 0,
            retentionRate: customerInsightsData.retention_rate || 0,
            customerChange: 12, // Using static value since not available in API
            newCustomerChange: 8, // Using static value since not available in API
            healthIndexChange: 0.3, // Using static value since not available in API
            retentionChange: 2 // Using static value since not available in API
          },
          // Create product performance data from recent customers, or use static data for now
          productPerformance: [
            { 
              id: 1,
              name: 'Gut Health Pro', 
              category: 'Gut Health', 
              impressions: 64245, 
              engagementRate: 19.8,
              trend: 'up' 
            },
            { 
              id: 2,
              name: 'Immune Defense', 
              category: 'Immune Health', 
              impressions: 53182, 
              engagementRate: 16.3,
              trend: 'up' 
            },
            { 
              id: 3,
              name: 'Brain Boost', 
              category: 'Cognitive Health', 
              impressions: 42165, 
              engagementRate: 14.7,
              trend: 'up' 
            },
            { 
              id: 4,
              name: 'Skin Radiance', 
              category: 'Skin Health', 
              impressions: 38128, 
              engagementRate: 12.9,
              trend: 'up' 
            },
            { 
              id: 5,
              name: 'Heart Health Complex', 
              category: 'Heart Health', 
              impressions: 21036, 
              engagementRate: 8.4,
              trend: 'neutral' 
            }
          ],
          // Use static data for category engagement 
          categoryEngagement: [
            { category: 'Gut Health', percentage: 45 },
            { category: 'Immune Health', percentage: 25 },
            { category: 'Cognitive Health', percentage: 15 },
            { category: 'Skin Health', percentage: 10 },
            { category: 'Heart Health', percentage: 5 }
          ],
          // Use static data for customer profile
          customerProfile: {
            ageGroup: {
              primary: '25-34',
              percentage: 38
            },
            healthFocus: {
              primary: 'Gut Health',
              percentage: 45
            },
            interactionRate: {
              value: '68%',
              period: 'Within 90 days'
            },
            timeToEngage: {
              value: '8.2 days',
              description: 'After viewing product'
            }
          },
          // Use customer data to generate insights or use static recommendations
          recommendations: [
            {
              title: 'Content Insight',
              text: 'Skin Radiance product page has a high bounce rate (62%). Our analysis suggests adding more detailed information about ingredients and benefits would increase engagement by approximately 27%.',
              primaryAction: 'Enhance Content',
              secondaryAction: 'View Details'
            },
            {
              title: 'Customer Interest Pattern',
              text: 'Customer who view Gut Health Pro have a 68% likelihood of also viewing Immune Defense within 3 days. Consider cross-promoting these products together to increase engagement.',
              primaryAction: 'Create Bundle',
              secondaryAction: 'View Details'
            },
            {
              title: 'Trending Interest',
              text: 'Brain Boost has seen a 32% increase in page views over the past 30 days, primarily from Customer aged 45-65. This presents an opportunity to create targeted content for this demographic.',
              primaryAction: 'Create Campaign',
              secondaryAction: 'View Details'
            },
            {
              title: 'Pricing Perception',
              text: 'User feedback suggests that Immune Defense ($37.99) is perceived as high value. Consider highlighting this value proposition more prominently in marketing materials.',
              primaryAction: 'Update Messaging',
              secondaryAction: 'View Analysis'
            }
          ]
        };
        
        setData(dashboardData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please check your connection and try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeParams.startDate, dateRangeParams.endDate, dateRangeParams.refreshTrigger]); // Re-fetch when date range changes or refresh is triggered

  return { data, loading, error };
}

export default useDashboardData;