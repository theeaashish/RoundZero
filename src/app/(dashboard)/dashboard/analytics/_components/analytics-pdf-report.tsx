"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { AnalyticsData } from "../_hooks/use-analytics";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 20,
    marginBottom: 30,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#6D28D9",
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    color: "#64748B",
  },
  meta: {
    alignItems: "flex-end",
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  metaSubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#475569",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 15,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 10,
  },
  trendPositive: {
    color: "#10B981",
  },
  trendNegative: {
    color: "#EF4444",
  },
  trendNeutral: {
    color: "#64748B",
  },
  listCard: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 15,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
  },
  bulletStrength: { backgroundColor: "#10B981" },
  bulletWeakness: { backgroundColor: "#F97316" },
  bulletSuggestion: { backgroundColor: "#6D28D9" },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#334155",
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  skillLabel: {
    width: 140,
    fontSize: 10,
    fontWeight: 700,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginRight: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6D28D9",
    borderRadius: 3,
  },
  skillValue: {
    width: 30,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: "#94A3B8",
  },
});

interface AnalyticsReportPDFProps {
  data: AnalyticsData;
  periodLabel: string;
}

export function AnalyticsReportPDF({
  data,
  periodLabel,
}: AnalyticsReportPDFProps) {
  const generatedDate = format(new Date(), "MMMM d, yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>RoundZero</Text>
            <Text style={styles.brandSubtitle}>Analytics Report</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaTitle}>{periodLabel}</Text>
            <Text style={styles.metaSubtitle}>Generated: {generatedDate}</Text>
          </View>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview Details</Text>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Sessions</Text>
              <Text style={styles.statValue}>
                {data.overview.totalInterviews}
              </Text>
              <Text
                style={[
                  styles.statTrend,
                  data.overview.interviewsChange > 0
                    ? styles.trendPositive
                    : data.overview.interviewsChange < 0
                      ? styles.trendNegative
                      : styles.trendNeutral,
                ]}
              >
                {data.overview.interviewsChange > 0 ? "+" : ""}
                {data.overview.interviewsChange}% change
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average Score</Text>
              <Text style={styles.statValue}>
                {data.overview.avgScore !== null
                  ? data.overview.avgScore
                  : "N/A"}
              </Text>
              <Text
                style={[
                  styles.statTrend,
                  data.overview.scoreChange > 0
                    ? styles.trendPositive
                    : data.overview.scoreChange < 0
                      ? styles.trendNegative
                      : styles.trendNeutral,
                ]}
              >
                {data.overview.scoreChange > 0 ? "+" : ""}
                {data.overview.scoreChange} pts change
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Practice Time (hrs)</Text>
              <Text style={styles.statValue}>
                {data.overview.totalPracticeTime}
              </Text>
              <Text
                style={[
                  styles.statTrend,
                  data.overview.timeChange > 0
                    ? styles.trendPositive
                    : data.overview.timeChange < 0
                      ? styles.trendNegative
                      : styles.trendNeutral,
                ]}
              >
                {data.overview.timeChange > 0 ? "+" : ""}
                {data.overview.timeChange}% change
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completion Rate</Text>
              <Text style={styles.statValue}>
                {data.overview.completionRate}%
              </Text>
              <Text
                style={[
                  styles.statTrend,
                  data.overview.completionChange > 0
                    ? styles.trendPositive
                    : data.overview.completionChange < 0
                      ? styles.trendNegative
                      : styles.trendNeutral,
                ]}
              >
                {data.overview.completionChange > 0 ? "+" : ""}
                {data.overview.completionChange}% change
              </Text>
            </View>
          </View>
        </View>

        {/* Skill Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Progress</Text>
          <View style={styles.listCard}>
            {data.skillRadar.map((skill) => (
              <View key={skill.skill} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{skill.skill}</Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${skill.current}%` },
                    ]}
                  />
                </View>
                <Text style={styles.skillValue}>{skill.current}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>AI Insights & Recommendations</Text>

          {data.insights.strengths && data.insights.strengths.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{
                  ...styles.statLabel,
                  color: "#10B981",
                  marginBottom: 8,
                }}
              >
                Key Strengths
              </Text>
              {data.insights.strengths.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, styles.bulletStrength]} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {data.insights.weaknesses && data.insights.weaknesses.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{
                  ...styles.statLabel,
                  color: "#F97316",
                  marginBottom: 8,
                }}
              >
                Areas for Improvement
              </Text>
              {data.insights.weaknesses.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, styles.bulletWeakness]} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {data.insights.suggestions &&
            data.insights.suggestions.length > 0 && (
              <View>
                <Text
                  style={{
                    ...styles.statLabel,
                    color: "#6D28D9",
                    marginBottom: 8,
                  }}
                >
                  Actionable Recommendations
                </Text>
                {data.insights.suggestions.map((item, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.bullet, styles.bulletSuggestion]} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by RoundZero Analytics
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
