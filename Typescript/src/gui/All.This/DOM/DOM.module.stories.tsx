import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ModuleSource } from '../All.This.types';
import DOMModule, { type DOMModuleProps } from './DOM.module';

const DOM_SAMPLE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>this.DOM sample</title>
  </head>
  <body>
    <h1>Hello this.DOM</h1>
    <p class="note">Sample HTML for parsing.</p>
    <div class="card">
      <strong>Device:</strong> Suis-MacBook-Air.local
    </div>
  </body>
</html>`;

function summarizeHtmlAsJson(html: string) {
  if (typeof DOMParser === 'undefined') {
    return JSON.stringify({ error: 'DOMParser unavailable' }, null, 2);
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map((node) =>
    String(node.textContent || '').trim()
  );
  const paragraphs = Array.from(doc.querySelectorAll('p')).map((node) =>
    String(node.textContent || '').trim()
  );
  const links = Array.from(doc.querySelectorAll('a[href]')).map((node) => ({
    href: node.getAttribute('href'),
    text: String(node.textContent || '').trim(),
  }));

  return JSON.stringify(
    {
      title: doc.title || null,
      headings,
      paragraphs,
      links,
      bodyText: String(doc.body?.textContent || '').trim(),
    },
    null,
    2
  );
}

function DOMModuleStory(args: DOMModuleProps) {
  const [source, setSource] = React.useState<ModuleSource>(args.source);
  const [fetchUrl, setFetchUrl] = React.useState(args.fetchUrl || 'https://example.com');
  const [htmlValue, setHtmlValue] = React.useState(args.htmlValue || '');
  const [jsonValue, setJsonValue] = React.useState(args.jsonValue || '{}');
  const [statusMessage, setStatusMessage] = React.useState(
    args.statusMessage || 'Ready.'
  );

  React.useEffect(() => {
    setSource(args.source);
  }, [args.source]);

  const loadSample = React.useCallback(() => {
    setHtmlValue(DOM_SAMPLE_HTML);
    setJsonValue(summarizeHtmlAsJson(DOM_SAMPLE_HTML));
    setStatusMessage('Sample loaded.');
  }, []);

  const parseHtml = React.useCallback(() => {
    const html = String(htmlValue || '').trim();
    if (!html) {
      setJsonValue(JSON.stringify({ error: 'HTML input is empty.' }, null, 2));
      setStatusMessage('HTML input is empty.');
      return;
    }
    setJsonValue(summarizeHtmlAsJson(html));
    setStatusMessage('Parsed HTML.');
  }, [htmlValue]);

  const fetchAndParse = React.useCallback(() => {
    const normalizedUrl = String(fetchUrl || '').trim();
    if (!normalizedUrl) {
      setStatusMessage('URL is empty.');
      return;
    }
    setHtmlValue(DOM_SAMPLE_HTML);
    setJsonValue(
      JSON.stringify(
        {
          source: normalizedUrl,
          parsed: JSON.parse(summarizeHtmlAsJson(DOM_SAMPLE_HTML)),
        },
        null,
        2
      )
    );
    setStatusMessage(`Fetched and parsed ${normalizedUrl}.`);
  }, [fetchUrl]);

  return (
    <DOMModule
      {...args}
      source={source}
      onSourceChange={setSource}
      fetchUrl={fetchUrl}
      onFetchUrlChange={setFetchUrl}
      htmlValue={htmlValue}
      onHtmlChange={setHtmlValue}
      jsonValue={jsonValue}
      statusMessage={statusMessage}
      onLoadSample={loadSample}
      onParseHtml={parseHtml}
      onFetchAndParse={fetchAndParse}
    />
  );
}

const meta: Meta<typeof DOMModule> = {
  title: 'All.This/DOM/Workbench',
  component: DOMModule,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DOM package interface example based on the runtime page: source control, URL input, HTML input, and JSON output.',
      },
    },
  },
  render: (args) => <DOMModuleStory {...args} />,
};

export default meta;
type Story = StoryObj<typeof DOMModule>;

export const RuntimeWorkbench: Story = {
  args: {
    source: 'local',
    state: 'on',
    assetUrl: './npm/dist/dom.umd.js',
    version: '1.0.98',
    fetchUrl: 'https://example.com',
    statusMessage: 'Ready.',
  },
};
