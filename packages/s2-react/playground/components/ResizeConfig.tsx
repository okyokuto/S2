import { ResizeType, type S2Theme } from '@antv/s2';
import {
  customMerge,
  type ThemeCfg,
  type ResizeInteractionOptions,
} from '@antv/s2';
import { Checkbox, Space, Switch, Tooltip } from 'antd';
import type { CheckboxValueType } from 'antd/lib/checkbox/Group';
import React from 'react';
import type { SheetComponentOptions } from '../../src/components';

const RESIZE_CONFIG: Array<{
  label: string;
  value: string;
}> = [
  { label: '角头热区', value: 'cornerCellHorizontal' },
  { label: '行头热区', value: 'rowCellVertical' },
  { label: '列头水平方向resize热区', value: 'colCellHorizontal' },
  { label: '列头垂直方向resize热区', value: 'colCellVertical' },
];

export const ResizeConfig: React.FC<{
  options: SheetComponentOptions;
  setThemeCfg: (cb: (theme: ThemeCfg) => ThemeCfg) => void;
  setOptions: (
    cb: (prev: SheetComponentOptions) => SheetComponentOptions,
  ) => void;
}> = ({ options, setThemeCfg, setOptions }) => {
  const [showResizeArea, setShowResizeArea] = React.useState(false);

  const onShowResizeAreaChange = (enable: boolean) => {
    const theme: S2Theme = {
      resizeArea: {
        backgroundOpacity: enable ? 1 : 0,
      },
    };
    setShowResizeArea(enable);
    setThemeCfg((prev) => customMerge(prev, { theme }));
  };

  const onSwitchRowResizeType =
    (type: 'rowResizeType' | 'colResizeType') => (enable: boolean) => {
      const options: SheetComponentOptions = {
        interaction: {
          resize: {
            [type]: enable ? ResizeType.CURRENT : ResizeType.ALL,
          },
        },
        style: {
          rowCell: {
            heightByField: null,
            widthByField: null,
          },
          colCell: {
            heightByField: null,
            widthByField: null,
          },
        },
      };
      setOptions((prev) => customMerge({}, prev, options));
    };

  const onResizeActiveChange = (checkedAreas: CheckboxValueType[]) => {
    const resize = RESIZE_CONFIG.reduce((cfg, item) => {
      const type = item.value;
      // @ts-ignore
      cfg[type] = checkedAreas.includes(type);
      return cfg;
    }, {});

    const updatedOptions: SheetComponentOptions = {
      interaction: {
        resize,
      },
    };

    setOptions((prev) => customMerge({}, prev, updatedOptions));
  };

  const resizeConfig = options.interaction?.resize as ResizeInteractionOptions;
  return (
    <Space>
      <Switch
        checkedChildren="宽高调整热区开"
        unCheckedChildren="宽高调整热区关"
        defaultChecked={showResizeArea}
        onChange={onShowResizeAreaChange}
      />
      <Checkbox.Group
        options={RESIZE_CONFIG}
        defaultValue={RESIZE_CONFIG.map((item) => item.value)}
        onChange={onResizeActiveChange}
      />
      <Tooltip title="行头高度调整时只影响当前行, 还是所有行">
        <Switch
          checkedChildren="行高单行调整开"
          unCheckedChildren="行高单行调整关"
          checked={resizeConfig?.rowResizeType === ResizeType.CURRENT}
          onChange={onSwitchRowResizeType('rowResizeType')}
        />
      </Tooltip>
      <Tooltip title="列头宽度调整时只影响当前列, 还是所有列">
        <Switch
          checkedChildren="列宽单行调整开"
          unCheckedChildren="列宽单行调整关"
          checked={resizeConfig?.colResizeType === ResizeType.CURRENT}
          onChange={onSwitchRowResizeType('colResizeType')}
        />
      </Tooltip>
    </Space>
  );
};
