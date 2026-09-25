package io.prtracker.reviewer;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** A person who can be assigned as a platform reviewer for specific components. */
@Entity
@Table(name = "reviewer")
public class Reviewer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false)
  private String handle;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "reviewer_component", joinColumns = @JoinColumn(name = "reviewer_id"))
  @Column(name = "component", nullable = false)
  private Set<String> components = new HashSet<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(nullable = false)
  private long version;

  protected Reviewer() {}

  public Reviewer(String name, String email, String handle) {
    this.name = name;
    this.email = email;
    this.handle = handle;
  }

  /** Adds a component unless an entry differing only in case already exists. */
  public boolean grant(String component) {
    return components.stream().noneMatch(c -> c.equalsIgnoreCase(component))
        && components.add(component);
  }

  /** Removes a component, ignoring case. */
  public boolean revoke(String component) {
    return components.removeIf(c -> c.equalsIgnoreCase(component));
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getHandle() {
    return handle;
  }

  public Set<String> getComponents() {
    return components;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
