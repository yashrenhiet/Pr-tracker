package io.prtracker.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/** A tracked pull request. Maps to {@code pr_review}. */
@Entity
@Table(name = "pr_review")
public class PrReview {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "pr_url", nullable = false)
  private String prUrl;

  @Column(nullable = false)
  private String component;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PrStatus status = PrStatus.READY_FOR_REVIEW;

  private String context;

  @Column(name = "raised_by", nullable = false)
  private String raisedBy;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "internal_reviewers", nullable = false)
  private List<String> internalReviewers = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "platform_reviewers", nullable = false)
  private List<String> platformReviewers = new ArrayList<>();

  @Column(name = "block_reason")
  private String blockReason;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false)
  private Map<String, String> metadata = new HashMap<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(nullable = false)
  private long version;

  /**
   * Changes status, enforcing that BLOCKED always carries a reason and other statuses never do.
   */
  public void changeStatus(PrStatus newStatus, String reason) {
    if (newStatus == PrStatus.BLOCKED && (reason == null || reason.isBlank())) {
      throw new IllegalArgumentException("blockReason is required when status is BLOCKED");
    }
    this.status = newStatus;
    this.blockReason = newStatus == PrStatus.BLOCKED ? reason.trim() : null;
  }

  public Long getId() {
    return id;
  }

  public String getPrUrl() {
    return prUrl;
  }

  public void setPrUrl(String prUrl) {
    this.prUrl = prUrl;
  }

  public String getComponent() {
    return component;
  }

  public void setComponent(String component) {
    this.component = component;
  }

  public PrStatus getStatus() {
    return status;
  }

  public String getContext() {
    return context;
  }

  public void setContext(String context) {
    this.context = context;
  }

  public String getRaisedBy() {
    return raisedBy;
  }

  public void setRaisedBy(String raisedBy) {
    this.raisedBy = raisedBy;
  }

  public List<String> getInternalReviewers() {
    return internalReviewers;
  }

  public void setInternalReviewers(List<String> internalReviewers) {
    this.internalReviewers = new ArrayList<>(internalReviewers);
  }

  public List<String> getPlatformReviewers() {
    return platformReviewers;
  }

  public void setPlatformReviewers(List<String> platformReviewers) {
    this.platformReviewers = new ArrayList<>(platformReviewers);
  }

  public String getBlockReason() {
    return blockReason;
  }

  public Map<String, String> getMetadata() {
    return metadata;
  }

  public void setMetadata(Map<String, String> metadata) {
    this.metadata = new HashMap<>(metadata);
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public long getVersion() {
    return version;
  }
}
