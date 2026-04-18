package com.agriinvest.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sip")
public class SIP {

    public enum Interval {
        DAILY,
        WEEKLY,
        FIFTEEN_DAYS,
        MONTHLY
    }

    @Id
    private String id;

    private String userId;
    private String projectId;
    private double amount;
    private String role;
    private int tenureYears;
    private double expectedAnnualReturn;
    private String provider;
    private String goalLabel;
    private boolean termsAccepted;
    private String status;
    private long startDate;
    private long nextDebitDate;
    private double estimatedMaturity;
    private Interval interval;
    private String autoDebitStatus;
    private String autoDebitProvider;
    private String autoDebitMandateReference;
    private String autoDebitPlanId;
    private long autoDebitPreparedAt;
    private String autoDebitFrequency;
    private long autoDebitAmountPaise;
    private String debitMode;
    private boolean autoDebitEnabled;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getTenureYears() { return tenureYears; }
    public void setTenureYears(int tenureYears) { this.tenureYears = tenureYears; }

    public double getExpectedAnnualReturn() { return expectedAnnualReturn; }
    public void setExpectedAnnualReturn(double expectedAnnualReturn) { this.expectedAnnualReturn = expectedAnnualReturn; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getGoalLabel() { return goalLabel; }
    public void setGoalLabel(String goalLabel) { this.goalLabel = goalLabel; }

    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getStartDate() { return startDate; }
    public void setStartDate(long startDate) { this.startDate = startDate; }

    public long getNextDebitDate() { return nextDebitDate; }
    public void setNextDebitDate(long nextDebitDate) { this.nextDebitDate = nextDebitDate; }

    public double getEstimatedMaturity() { return estimatedMaturity; }
    public void setEstimatedMaturity(double estimatedMaturity) { this.estimatedMaturity = estimatedMaturity; }

    public Interval getInterval() { return interval; }
    public void setInterval(Interval interval) { this.interval = interval; }

    public String getAutoDebitStatus() { return autoDebitStatus; }
    public void setAutoDebitStatus(String autoDebitStatus) { this.autoDebitStatus = autoDebitStatus; }

    public String getAutoDebitProvider() { return autoDebitProvider; }
    public void setAutoDebitProvider(String autoDebitProvider) { this.autoDebitProvider = autoDebitProvider; }

    public String getAutoDebitMandateReference() { return autoDebitMandateReference; }
    public void setAutoDebitMandateReference(String autoDebitMandateReference) { this.autoDebitMandateReference = autoDebitMandateReference; }

    public String getAutoDebitPlanId() { return autoDebitPlanId; }
    public void setAutoDebitPlanId(String autoDebitPlanId) { this.autoDebitPlanId = autoDebitPlanId; }

    public long getAutoDebitPreparedAt() { return autoDebitPreparedAt; }
    public void setAutoDebitPreparedAt(long autoDebitPreparedAt) { this.autoDebitPreparedAt = autoDebitPreparedAt; }

    public String getAutoDebitFrequency() { return autoDebitFrequency; }
    public void setAutoDebitFrequency(String autoDebitFrequency) { this.autoDebitFrequency = autoDebitFrequency; }

    public long getAutoDebitAmountPaise() { return autoDebitAmountPaise; }
    public void setAutoDebitAmountPaise(long autoDebitAmountPaise) { this.autoDebitAmountPaise = autoDebitAmountPaise; }

    public String getDebitMode() { return debitMode; }
    public void setDebitMode(String debitMode) { this.debitMode = debitMode; }

    public boolean isAutoDebitEnabled() { return autoDebitEnabled; }
    public void setAutoDebitEnabled(boolean autoDebitEnabled) { this.autoDebitEnabled = autoDebitEnabled; }
}
