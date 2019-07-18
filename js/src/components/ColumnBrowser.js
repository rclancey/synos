import React from "react";
import { Column, Table } from "react-virtualized";

export class ColumnBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.rowClassName = this.rowClassName.bind(this);
    this.onClick = this.onClick.bind(this);
    this.node = null;
    if (!window.columnBrowser) {
      window.columnBrowser = {};
    }
    window.columnBrowser[props.kind] = this;
  }

  onClick({ event, index, rowData }) {
    this.props.onClick(event.metaKey, this.props.kind, rowData.val);
  }

  rowClassName({ index }) {
    if (index < 0) {
      return 'header';
    }
    if (this.props.selected && this.props.items[index] && this.props.selected[this.props.items[index].name.toLowerCase()]) {
      return 'selected';
    }
    if (index === 0 && Object.keys(this.props.selected).length === 0) {
      return 'selected';
    }
    return 'row';
    //return index % 2 == 0 ? 'even' : 'odd';
  }

  render() {
    const list = this.props.items;
    return (
      <div
        className={`columnBrowser ${this.props.kind}`}
        width={this.props.width}
      >
        <Table
          width={this.props.width}
          height={this.props.height}
          headerHeight={20}
          rowHeight={18}
          rowCount={list.length}
          rowGetter={({ index }) => list[index]}
          rowClassName={this.rowClassName}
          onRowClick={this.onClick}
        >
          <Column
            headerRenderer={this.renderHeader}
            dataKey="name"
            label={this.props.title}
            width={this.props.width}
          />
        </Table>
      </div>
    );
  }
}
