import React, { useState, useCallback, useEffect, ChangeEvent, MouseEvent, useMemo } from 'react';
import debounce from 'lodash.debounce';
import axios from 'axios';
import styles from './Records.module.css';
import 'url-search-params-polyfill';
import { IRecord } from '../../interfaces/IRecord';
import { headings } from './headings';

type InputEvent = ChangeEvent<HTMLInputElement>;
type ChangeHandler = (e: InputEvent) => void;
type ChangeSelectHandler = (e: ChangeEvent<HTMLSelectElement>) => void;
type ButtonClickHandler = (e: MouseEvent<HTMLButtonElement>, v: string) => void;

const loadParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sort = urlParams.get('sort') || '';
    const limit = urlParams.get('limit') || 10;
    const page = urlParams.get('page') || 1;

    return { sort, limit, page };
};

const APP_URL = process.env.REACT_APP_IS_SERVED ? '' : process.env.REACT_APP_SERVER || 'http://localhost:3000/';

export function Records() {
    const initParams = useMemo(() => loadParams, []);

    const [searchValue, setSearchValue] = useState('');
    const [sortParam, setSortParam] = useState(initParams().sort);
    const [pageParam, setPageParam] = useState(initParams().page);
    const [limitParam, setLimitParam] = useState(initParams().limit);
    const [totalPages, setTotalPages] = useState(1);
    const [errorData, setError] = useState();

    const [records, setRecords] = useState([] as IRecord[]);

    const callAction = useMemo(
        () => async (search?: string, sort?: string, limit?: string | number, page?: string | number) => {
            setError(undefined);

            const urlParam = new URLSearchParams();
            sort && urlParam.set('sort', sort);
            limit && urlParam.set('limit', limit.toString());
            page && urlParam.set('page', page.toString());

            search && urlParam.set('name', `/${search}/i`);
            try {
                const { data } = await axios.get(`${APP_URL}v1/records?${urlParam.toString()}`);

                setRecords(data.data);
                setTotalPages(data.meta.totalPages);
            } catch (err) {
                setError(err.body?.message || err.message || err);
            }
        },
        []
    );

    const searchQuery = useCallback(debounce(callAction, 500), [sortParam]);

    const onSearchChange: ChangeHandler = (event) => {
        setSearchValue(event.target.value);
        setPageParam(1);
        searchQuery(event.target.value, sortParam, limitParam, 1);
        const pageUrlParam = new URLSearchParams(window.location.search);
        pageUrlParam.set('page', '1');
        window.history.replaceState({ page: 1 }, '', `?${pageUrlParam.toString()}`);
    };

    const onSortClick = (colName: string) => {
        let updatedSortParam = sortParam;
        if (sortParam.replace(/-/g, '') === colName) {
            if (sortParam.startsWith('-')) {
                updatedSortParam = colName;
            } else {
                updatedSortParam = `-${colName}`;
            }
        } else {
            updatedSortParam = `-${colName}`;
        }

        const sortParams = new URLSearchParams(window.location.search);
        sortParams.set('sort', updatedSortParam);

        window.history.replaceState({ sort: updatedSortParam }, '', `?${sortParams.toString()}`);

        setSortParam(updatedSortParam);

        callAction(searchValue, updatedSortParam, limitParam, pageParam);
    };

    const onLimitChange: ChangeSelectHandler = (event) => {
        setPageParam(1);
        setLimitParam(event.target.value);

        const pageUrlParam = new URLSearchParams(window.location.search);
        pageUrlParam.set('page', '1');
        pageUrlParam.set('limit', event.target.value);

        window.history.replaceState({ page: 1, limit: event.target.value }, '', `?${pageUrlParam.toString()}`);
        callAction(searchValue, sortParam, event.target.value, 1);
    };

    const onPageChange: ButtonClickHandler = (event, value) => {
        event.preventDefault();
        const pageValue = Number(pageParam) || 1;
        let newPageValue = pageValue;
        if (value === 'prev' && pageValue > 1) {
            newPageValue = pageValue - 1;
        }
        if (value === 'next' && pageValue < Number(totalPages)) {
            newPageValue = pageValue + 1;
        }
        setPageParam(newPageValue);
        const pageUrlParam = new URLSearchParams(window.location.search);
        pageUrlParam.set('page', newPageValue.toString());

        window.history.replaceState({ page: newPageValue }, '', `?${pageUrlParam.toString()}`);
        callAction(searchValue, sortParam, limitParam, newPageValue);
    };

    const getDownloadParams = useCallback(() => {
        const urlParam = new URLSearchParams();
        urlParam.set('sort', sortParam);

        urlParam.set('name', `/${searchValue}/i`);
        return urlParam.toString();
    }, [searchValue, sortParam]);

    useEffect(() => {
        callAction(undefined, initParams().sort, initParams().limit, initParams().page);
    }, [callAction, initParams]);

    return (
        <div className={styles.fullScreenTable}>
            <div className={styles.fixedToolbar}>
                <div className={styles.searchGroup}>
                    <input
                        type="text"
                        placeholder="Search"
                        aria-label="Search"
                        className={styles.searchBox}
                        onChange={onSearchChange}
                        value={searchValue}
                        autoComplete="off"
                    />
                </div>
                <div className={styles.displayTable}>
                    <div className={styles.tableContainer}>
                        {errorData && <div className={styles.helperMessage}>{errorData}</div>}
                        {!errorData && (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {headings.map((heading) => (
                                            <th
                                                key={heading.special}
                                                onClick={() => onSortClick(heading.special)}
                                                className={
                                                    heading.colName === 'Player' || heading.colName === 'Team'
                                                        ? styles.textLeft
                                                        : ''
                                                }>
                                                {heading.colName}
                                                <span
                                                    className={
                                                        sortParam.replace(/-/g, '') !== heading.special
                                                            ? styles.sortingIcon
                                                            : styles.sortingIconSorted
                                                    }>
                                                    {sortParam.replace(/-/g, '') === heading.special &&
                                                    !sortParam.startsWith('-')
                                                        ? '▲'
                                                        : '▼'}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={`${record.Player.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {headings.map((heading) => (
                                                <td
                                                    key={`${record.Player.replace(/\s+/g, '-').toLowerCase()}${
                                                        heading.special
                                                    }`}
                                                    className={
                                                        heading.colName === 'Player' || heading.colName === 'Team'
                                                            ? styles.textLeft
                                                            : ''
                                                    }>
                                                    {record[heading.colName]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {records.length ? (
                            <div className={styles.downloadContainer}>
                                <a href={`${APP_URL}v1/records/csv?${getDownloadParams()}`} download>
                                    <button>Download Data</button>
                                </a>
                            </div>
                        ) : (
                            <div className={styles.helperMessage}>No Records Found</div>
                        )}
                        {!errorData && Number(totalPages) > 1 && (
                            <div className={styles.paginationContainer}>
                                <div className={styles.limit}>
                                    <span>Records per page:</span>
                                    <select onChange={onLimitChange} defaultValue={limitParam}>
                                        <option value={10}>10</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <div className={styles.paginate}>
                                    <span>
                                        Page {pageParam} of {totalPages}
                                    </span>
                                    <button
                                        className={styles.backButton}
                                        disabled={Number(pageParam) === 1}
                                        onClick={(event) => onPageChange(event, 'prev')}>
                                        <div></div>
                                    </button>
                                    <button
                                        className={styles.nextButton}
                                        disabled={Number(pageParam) === Number(totalPages)}
                                        onClick={(event) => onPageChange(event, 'next')}>
                                        <div></div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(Records);
