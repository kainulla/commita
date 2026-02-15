# Commita — Business Requirements Document

**Project**: Commita — Personal GitHub insights, beautifully visualized
**Version**: 1.0
**Date**: 2026-02-15

---

## 1. Product Overview

Commita is a GitHub insights tool that uses intelligent analysis of commit history to highlight fun patterns, hidden habits, and interesting facts. It generates a visual SVG card that can be embedded in GitHub READMEs or portfolios.

### 1.1 Problem Statement

GitHub profiles display raw contribution graphs and repository lists but lack personality and deeper behavioral insights. Developers have no easy way to showcase their coding patterns, habits, and personality through their commit history.

### 1.2 Value Proposition

Commita transforms raw commit data into meaningful, shareable visual insights — giving developers a fun and expressive way to enrich their GitHub profiles beyond standard statistics.

### 1.3 Target Users

- Developers who maintain active GitHub profiles
- Open-source contributors who want to showcase their work patterns
- Developers building portfolio sites or enhanced GitHub READMEs

---

## 2. Functional Requirements

### 2.1 Commit Pattern Analysis

| ID | Requirement | Priority |
|----|-------------|----------|
| F-101 | Scan public repositories for a given GitHub username | Must Have |
| F-102 | Determine most active days of the week | Must Have |
| F-103 | Determine most productive hours of the day | Must Have |
| F-104 | Calculate total commits analyzed across all public repos | Must Have |

### 2.2 Personalized Git Facts

| ID | Requirement | Priority |
|----|-------------|----------|
| F-201 | Identify the single most committed day (date with highest commit count) | Must Have |
| F-202 | Identify the most productive hour (hour with highest average commits) | Must Have |
| F-203 | Display total number of commits analyzed | Must Have |
| F-204 | Show number of public repositories scanned | Should Have |

### 2.3 Commit Streak Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| F-301 | Calculate longest streak of consecutive contribution days | Must Have |
| F-302 | Display current active streak length | Should Have |
| F-303 | Show streak start and end dates | Should Have |

### 2.4 Commit Message Insights

| ID | Requirement | Priority |
|----|-------------|----------|
| F-401 | Detect the shortest commit message | Must Have |
| F-402 | Detect the longest commit message | Must Have |
| F-403 | Detect most creative/unusual commit messages | Should Have |
| F-404 | Track emoji usage in commit messages | Should Have |
| F-405 | Calculate average commit message length | Could Have |

### 2.5 Visual Card Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| F-501 | Generate a lightweight SVG card with all insights | Must Have |
| F-502 | Card must be embeddable via `<img>` tag in GitHub Markdown | Must Have |
| F-503 | Card must render correctly on GitHub READMEs | Must Have |
| F-504 | Card must be visually appealing with clean typography | Must Have |
| F-505 | Support light and dark theme variants | Should Have |

### 2.6 Profile Enrichment

| ID | Requirement | Priority |
|----|-------------|----------|
| F-601 | Provide a copy-paste embed snippet for GitHub READMEs | Must Have |
| F-602 | Card accessible via a stable URL (e.g., `commita.dev/<username>`) | Must Have |
| F-603 | Support embedding in portfolio websites | Should Have |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NF-101 | SVG card generation response time | < 5 seconds for users with up to 50 repos |
| NF-102 | Card file size | < 50 KB |
| NF-103 | API response caching | Cache results for at least 1 hour |

### 3.2 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NF-201 | Handle concurrent card generation requests | 100+ simultaneous users |
| NF-202 | Support users with large commit histories | Up to 10,000 commits |

### 3.3 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NF-301 | Service uptime | 99% availability |
| NF-302 | Graceful handling of GitHub API rate limits | Queue or cache fallback |
| NF-303 | Graceful degradation when data is incomplete | Show partial card with available data |

### 3.4 Security

| ID | Requirement | Target |
|----|-------------|--------|
| NF-401 | Only access publicly available GitHub data | No auth tokens required from users |
| NF-402 | No storage of personal user data beyond cache | Ephemeral processing |
| NF-403 | Sanitize all user-sourced data (commit messages) before SVG rendering | Prevent XSS injection |

---

## 4. Technical Constraints

- Must use the GitHub REST or GraphQL API for data retrieval
- Must respect GitHub API rate limits (60 requests/hour unauthenticated, 5000/hour authenticated)
- SVG output must comply with GitHub's Content Security Policy for rendering in READMEs
- No JavaScript execution inside SVG (GitHub strips `<script>` and event handlers)
- Card must render as a static image when embedded via `<img src="...">`

---

## 5. User Flow

```
1. User visits commita.dev (or uses API directly)
2. User enters their GitHub username
3. System fetches public repos and commit history via GitHub API
4. System analyzes commit patterns, streaks, and messages
5. System generates an SVG card with the insights
6. User previews the card
7. User copies the embed snippet for their README
8. Card is served via a persistent URL for ongoing embedding
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Card generation success rate | > 95% of valid usernames |
| Average generation time | < 3 seconds |
| SVG renders correctly on GitHub | 100% of supported browsers |
| User returns to update/re-embed | 20%+ retention |

---

## 7. Out of Scope (v1.0)

- Private repository analysis (requires OAuth)
- Organization-level insights
- Historical trend tracking over time
- Comparison between users
- Mobile app or browser extension
- Real-time webhook-based updates
