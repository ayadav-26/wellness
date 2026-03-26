const trimAndValidate = (req, res, next) => {
    const trimValue = (obj) => {
        if (typeof obj === 'string') {
            const trimmed = obj.trim();
            if (trimmed === '') return null; // Convert empty strings to null for validation
            return trimmed;
        } else if (Array.isArray(obj)) {
            return obj.map(trimValue);
        } else if (typeof obj === 'object' && obj !== null) {
            const newObj = {};
            for (const key in obj) {
                newObj[key] = trimValue(obj[key]);
            }
            return newObj;
        }
        return obj;
    };

    if (req.body) {
        req.body = trimValue(req.body);
    }
    if (req.query) {
        req.query = trimValue(req.query);
    }
    if (req.params) {
        req.params = trimValue(req.params);
    }

    // Check for null values in required fields (optional, but requested)
    // "Reject: Null values, Empty strings, Strings containing only spaces"
    // Since we converted empty/spaces to null, we just need to check for null if we want to be strict here.
    // However, Sequelize's allowNull: false will handle this for database fields.
    // To handle it globally for ALL incoming requests:
    /*
    const hasNull = (obj) => {
        if (obj === null) return true;
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (hasNull(obj[key])) return true;
            }
        }
        return false;
    };
    */

    next();
};

module.exports = trimAndValidate;
