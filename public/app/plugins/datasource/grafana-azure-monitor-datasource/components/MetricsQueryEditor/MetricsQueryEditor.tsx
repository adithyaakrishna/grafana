import React from 'react';

import { PanelData } from '@grafana/data/src/types';
import { EditorRows, EditorRow, EditorFieldGroup } from '@grafana/experimental';
import { config } from '@grafana/runtime';

import { multiResourceCompatibleTypes } from '../../azureMetadata';
import type Datasource from '../../datasource';
import type { AzureMonitorQuery, AzureMonitorOption, AzureMonitorErrorish } from '../../types';
import ResourceField from '../ResourceField';
import { ResourceRow, ResourceRowGroup, ResourceRowType } from '../ResourcePicker/types';
import { parseResourceDetails } from '../ResourcePicker/utils';

import AggregationField from './AggregationField';
import DimensionFields from './DimensionFields';
import LegendFormatField from './LegendFormatField';
import MetricNameField from './MetricNameField';
import MetricNamespaceField from './MetricNamespaceField';
import TimeGrainField from './TimeGrainField';
import TopField from './TopField';
import { useMetricNames, useMetricNamespaces, useMetricMetadata } from './dataHooks';

interface MetricsQueryEditorProps {
  data: PanelData | undefined;
  query: AzureMonitorQuery;
  datasource: Datasource;
  onChange: (newQuery: AzureMonitorQuery) => void;
  variableOptionGroup: { label: string; options: AzureMonitorOption[] };
  setError: (source: string, error: AzureMonitorErrorish | undefined) => void;
}

const MetricsQueryEditor: React.FC<MetricsQueryEditorProps> = ({
  data,
  query,
  datasource,
  variableOptionGroup,
  onChange,
  setError,
}) => {
  const metricsMetadata = useMetricMetadata(query, datasource, onChange);
  const metricNamespaces = useMetricNamespaces(query, datasource, onChange, setError);
  const metricNames = useMetricNames(query, datasource, onChange, setError);
  const resources =
    query.azureMonitor?.resources?.map((r) => ({
      subscription: query.subscription,
      resourceGroup: r.resourceGroup,
      metricNamespace: query.azureMonitor?.metricNamespace,
      resourceName: r.resourceName,
      region: query.azureMonitor?.region,
    })) ?? [];
  const disableRow = (row: ResourceRow, selectedRows: ResourceRowGroup) => {
    if (selectedRows.length === 0) {
      // Only if there is some resource(s) selected we should disable rows
      return false;
    }
    if (!config.featureToggles.azureMultipleResourcePicker) {
      // Disable multiple selection until the feature is ready
      return true;
    }

    const rowResource = parseResourceDetails(row.uri, row.location);
    const selectedRowSample = parseResourceDetails(selectedRows[0].uri, selectedRows[0].location);
    // Only resources:
    // - in the same subscription
    // - in the same region
    // - with the same metric namespace
    // - with a metric namespace that is compatible with multi-resource queries
    return (
      rowResource.subscription !== selectedRowSample.subscription ||
      rowResource.region !== selectedRowSample.region ||
      rowResource.metricNamespace?.toLocaleLowerCase() !== selectedRowSample.metricNamespace?.toLocaleLowerCase() ||
      !multiResourceCompatibleTypes[rowResource.metricNamespace?.toLocaleLowerCase() ?? '']
    );
  };

  return (
    <span data-testid="azure-monitor-metrics-query-editor-with-experimental-ui">
      <EditorRows>
        <EditorRow>
          <EditorFieldGroup>
            <ResourceField
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
              selectableEntryTypes={[ResourceRowType.Resource]}
              resources={resources ?? []}
              queryType={'metrics'}
              disableRow={disableRow}
            />
            <MetricNamespaceField
              metricNamespaces={metricNamespaces}
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
            />
            <MetricNameField
              metricNames={metricNames}
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
            />
            <AggregationField
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
              aggregationOptions={metricsMetadata?.aggOptions ?? []}
              isLoading={metricsMetadata.isLoading}
            />
            <TimeGrainField
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
              timeGrainOptions={metricsMetadata?.timeGrains ?? []}
            />
          </EditorFieldGroup>
        </EditorRow>
        <EditorRow>
          <EditorFieldGroup>
            <DimensionFields
              data={data}
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
              dimensionOptions={metricsMetadata?.dimensions ?? []}
            />
          </EditorFieldGroup>
        </EditorRow>
        <EditorRow>
          <EditorFieldGroup>
            <TopField
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
            />
            <LegendFormatField
              query={query}
              datasource={datasource}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={onChange}
              setError={setError}
            />
          </EditorFieldGroup>
        </EditorRow>
      </EditorRows>
    </span>
  );
};

export default MetricsQueryEditor;
