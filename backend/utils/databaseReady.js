module.exports = async function databaseReady(database) {
  try {
    await database.query('SELECT 1');
    return true;
  } catch (_error) {
    return false;
  }
};
