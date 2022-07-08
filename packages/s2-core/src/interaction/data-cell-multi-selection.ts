import type { Event } from '@antv/g-canvas';
import { isEmpty } from 'lodash';
import type { DataCell } from '../cell';
import {
  InteractionStateName,
  InterceptType,
  S2Event,
} from '../common/constant';
import type { CellMeta, S2CellType, ViewMeta } from '../common/interface';
import {
  getCellMeta,
  isMultiSelectionKey,
} from '../utils/interaction/select-event';
import { getActiveCellsTooltipData } from '../utils/tooltip';
import { BaseEvent, type BaseEventImplement } from './base-interaction';

export class DataCellMultiSelection
  extends BaseEvent
  implements BaseEventImplement
{
  private isMultiSelection = false;

  public bindEvents() {
    this.bindKeyboardDown();
    this.bindDataCellClick();
    this.bindKeyboardUp();
  }

  public reset() {
    this.isMultiSelection = false;
    this.spreadsheet.interaction.removeIntercepts([InterceptType.CLICK]);
  }

  private bindKeyboardDown() {
    this.spreadsheet.on(
      S2Event.GLOBAL_KEYBOARD_DOWN,
      (event: KeyboardEvent) => {
        if (isMultiSelectionKey(event)) {
          this.isMultiSelection = true;
          this.spreadsheet.interaction.addIntercepts([InterceptType.CLICK]);
        }
      },
    );
  }

  private bindKeyboardUp() {
    this.spreadsheet.on(S2Event.GLOBAL_KEYBOARD_UP, (event: KeyboardEvent) => {
      if (isMultiSelectionKey(event)) {
        this.reset();
      }
    });
  }

  private getSelectedCells(cell: S2CellType<ViewMeta>) {
    const id = cell.getMeta().id;
    const { interaction } = this.spreadsheet;
    let selectedCells = interaction.getCells();
    let cells: CellMeta[] = [];
    if (interaction.getCurrentStateName() !== InteractionStateName.SELECTED) {
      selectedCells = [];
    }
    if (selectedCells.find((meta) => meta.id === id)) {
      cells = selectedCells.filter((item) => item.id !== id);
    } else {
      cells = [...selectedCells, getCellMeta(cell)];
    }

    return cells;
  }

  private bindDataCellClick() {
    this.spreadsheet.on(S2Event.DATA_CELL_CLICK, (event: Event) => {
      event.stopPropagation();
      const cell: DataCell = this.spreadsheet.getCell(event.target);
      const meta = cell.getMeta();
      const { interaction } = this.spreadsheet;

      if (this.isMultiSelection && meta) {
        const selectedCells = this.getSelectedCells(cell);

        if (isEmpty(selectedCells)) {
          interaction.clearState();
          this.spreadsheet.hideTooltip();
          return;
        }

        interaction.addIntercepts([InterceptType.CLICK, InterceptType.HOVER]);
        this.spreadsheet.hideTooltip();
        interaction.changeState({
          cells: selectedCells,
          stateName: InteractionStateName.SELECTED,
        });
        this.spreadsheet.emit(
          S2Event.GLOBAL_SELECTED,
          interaction.getActiveCells(),
        );
        this.spreadsheet.showTooltipWithInfo(
          event,
          getActiveCellsTooltipData(this.spreadsheet),
        );
      }
    });
  }
}
