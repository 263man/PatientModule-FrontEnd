 import React from 'react';

function ConfirmationModal({ message, onConfirm, onCancel, loading, error }) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Confirm Action</h3>
                <p className="text-gray-700 mb-6">{message}</p>

                {loading && <p className="text-blue-600 text-sm mb-4">Processing...</p>}
                {error && <p className="text-red-600 text-sm mb-4">Error: {error}</p>}

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        disabled={loading}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;

