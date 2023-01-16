import React from 'react';
import ReactDOM from 'react-dom';
import { SpreadSheet, BaseTooltip, S2Event, GEvent } from '@antv/s2';
import { createMockCellInfo, getContainer, sleep } from 'tests/util/helpers';
import * as mockDataConfig from 'tests/data/simple-data.json';
import { act } from 'react-dom/test-utils';
import { StarOutlined } from '@ant-design/icons';
import { SheetComponent } from '@/components/sheets';
import type { SheetComponentOptions } from '@/components/sheets/interface';
import { CustomTooltip } from '@/components/tooltip/custom-tooltip';

const s2Options: SheetComponentOptions = {
  width: 200,
  height: 200,
  hdAdapter: false,
  tooltip: {
    showTooltip: true,
  },
};

let s2: SpreadSheet;

function MainLayout() {
  return (
    <SheetComponent
      adaptive={false}
      sheetType="pivot"
      dataCfg={mockDataConfig}
      options={s2Options}
      themeCfg={{ name: 'default' }}
      onMounted={(instance) => {
        s2 = instance;
      }}
    />
  );
}

describe('SheetComponent Tooltip Tests', () => {
  beforeEach(() => {
    s2?.destroy();
  });

  beforeEach(() => {
    act(() => {
      ReactDOM.render(<MainLayout />, getContainer());
    });
  });

  // https://github.com/antvis/S2/issues/828

  test('should not throw error if multiple call showTooltip', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await sleep(1000);

    const showTooltip = () => {
      s2.showTooltip({ position: { x: 0, y: 0 }, content: '111' });
    };

    act(() => {
      Array.from({ length: 10 }).forEach(() => {
        expect(showTooltip).not.toThrow();
      });
    });
    showTooltip();

    expect(errorSpy).not.toHaveBeenCalledWith(
      `Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`,
    );

    errorSpy.mockRestore();
  });

  test('should init custom tooltip and instance of BaseTooltip', async () => {
    await sleep(1000);
    expect(s2.tooltip).toBeInstanceOf(BaseTooltip);
    expect(s2.tooltip).toBeInstanceOf(CustomTooltip);
  });

  test('should get renderTooltip options', async () => {
    await sleep(1000);
    const { renderTooltip } = s2.options.tooltip!;

    expect(renderTooltip).toBeFunction();
    expect(renderTooltip!(s2)).toBeInstanceOf(CustomTooltip);
  });

  test('should render tooltip content for jsx element', async () => {
    await sleep(1000);
    const content = <div id="custom-content">content</div>;

    s2.showTooltip({ position: { x: 0, y: 0 }, content });

    expect(s2.tooltip.container!.querySelector('#custom-content')).toBeTruthy();
  });

  test('should support callback tooltip content for string', async () => {
    await sleep(1000);

    s2.showTooltip({
      position: {
        x: 10,
        y: 10,
      },
      content: () => 'custom callback content',
    });

    expect(s2.tooltip.container!.innerHTML).toEqual('custom callback content');
  });

  test('should support callback tooltip content for element', async () => {
    await sleep(1000);

    const content = (
      <div id="custom-callback-content">custom callback content</div>
    );

    s2.showTooltip({
      position: {
        x: 10,
        y: 10,
      },
      content: () => content,
    });

    expect(
      s2.tooltip.container!.querySelector('#custom-callback-content'),
    ).toBeTruthy();
  });

  // https://github.com/antvis/S2/issues/852
  test('should not show unique key prop warning', async () => {
    await sleep(1000);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const content = (
      <div>
        <div>content1</div>
        <div>content2</div>
      </div>
    );

    act(() => {
      Array.from({ length: 3 }).forEach(() => {
        s2.showTooltip({
          position: {
            x: 10,
            y: 10,
          },
          content,
        });
      });
    });

    expect(errorSpy).not.toThrow();
    expect(warnSpy).not.toThrow();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // https://github.com/antvis/S2/issues/873
  test('should not throw error when hover trend icon', async () => {
    await sleep(1000);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockCell = createMockCellInfo('test', { rowIndex: 0, colIndex: 0 });

    s2.getCell = () => mockCell.mockCell;

    s2.emit(S2Event.DATA_CELL_CLICK, { stopPropagation: () => {} } as GEvent);

    document
      .querySelector('.ant-dropdown-trigger')
      ?.dispatchEvent(new Event('click'));

    expect(errorSpy).not.toThrow(
      'Uncaught Error: React.Children.only expected to receive a single React element child.',
    );

    errorSpy.mockRestore();
  });

  test.each([{ forceRender: true }, { forceRender: false }])(
    'should not unmount component after show tooltip and %o',
    async ({ forceRender }) => {
      await sleep(1000);

      const unmountComponentAtNodeSpy = jest
        .spyOn(ReactDOM, 'unmountComponentAtNode')
        .mockImplementationOnce(() => true);

      s2.showTooltip({ position: { x: 0, y: 0 }, options: { forceRender } });
      s2.showTooltipWithInfo({} as MouseEvent, [], { forceRender });
      s2.hideTooltip();

      expect(unmountComponentAtNodeSpy).toHaveBeenCalledTimes(
        forceRender ? 2 : 0,
      );
    },
  );

  test('should support render ReactNode for operator menus', async () => {
    await sleep(1000);

    s2.showTooltip({
      position: { x: 0, y: 0 },
      options: {
        operator: {
          menus: [
            {
              key: 'menu-a',
              // @ts-ignore
              text: <div className="menu-text">text</div>,
              // @ts-ignore
              icon: <StarOutlined className="menu-icon" />,
            },
          ],
        },
      },
    });

    const { container } = s2.tooltip;
    const customMenuTextNode = container?.querySelector('.menu-text');

    expect(customMenuTextNode).toBeTruthy();
    expect(customMenuTextNode?.innerHTML).toEqual('text');
    expect(container?.querySelector('.menu-icon')).toBeTruthy();
  });
});
