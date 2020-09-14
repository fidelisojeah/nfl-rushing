import React from 'react';

import Records from './features/records/Records';

function App() {
    return (
        <div className="wrapper">
            <Records />
        </div>
    );
}

export default React.memo(App);
