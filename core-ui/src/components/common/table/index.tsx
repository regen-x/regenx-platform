import React from 'react';

export interface TableColumn<T> {
	header: string;
	accessor: keyof T;
	shouldRender: boolean;
	dataTest?: (row: T) => string;
	renderCell?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface ITableProps<T> {
	data: T[];
	columns: TableColumn<T>[];
	tableClassName?: string;
	headClassName?: string;
	headerRowClassName?: string;
	tableHeaderClassName?: string;
	tableBodyClassName?: string;
	bodyRowClassName?: string;
	tableDatumClassName?: string;
	dataTest?: string;
}

const Table = <T extends object>({
	data,
	columns,
	tableClassName,
	headClassName,
	headerRowClassName,
	tableHeaderClassName,
	tableBodyClassName,
	bodyRowClassName,
	tableDatumClassName,
	dataTest,
}: ITableProps<T>) => {
	return (
		<table
			className={tableClassName || 'w-full border border-gray-b'}
			data-test={dataTest}
		>
			<thead className={headClassName || 'w-full'}>
				<tr className={headerRowClassName || 'w-full'}>
					{columns
						.filter(({ shouldRender }) => shouldRender)
						.map(({ accessor, header }, index) => (
							<th
								key={(accessor as string) + index}
								className={
									tableHeaderClassName ||
									'font-Roboto py-3 text-start border border-gray-b capitalize'
								}
							>
								{header}
							</th>
						))}
				</tr>
			</thead>
			<tbody className={tableBodyClassName || 'w-full'}>
				{data.map((rows, index) => (
					<tr
						key={`table-row-${index}`}
						className={bodyRowClassName || 'w-full'}
						data-test="table-row"
					>
						{columns
							.filter(({ shouldRender }) => shouldRender)
							.map(({ accessor, dataTest, renderCell }, index) => (
								<td
									key={(accessor as string) + index}
									className={
										tableDatumClassName ||
										'font-Roboto py-3 text-start border border-gray-b'
									}
									data-test={
										dataTest
											? dataTest(rows)
											: `table-row-${accessor as string}`
									}
								>
									{renderCell
										? renderCell(rows[accessor], rows)
										: (rows[accessor] as string)}
								</td>
							))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default Table;
