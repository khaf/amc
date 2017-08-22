import {  authConnection as authConnectionAPI, listConnections, getClusterEntityTree as getClusterEntityTreeAPI } from 'api/clusterConnections';

import { expandEntityNode } from 'actions/entityTree';
import { selectStartView } from 'actions/currentView';
import { selectClusterOnStartup, selectCluster } from 'actions/currentView';
import { CLUSTER_ACTIONS } from 'classes/entityActions';
import { VIEW_TYPE } from 'classes/constants';

// ---------------------------
// Adding a Cluster Connection

export const DISPLAY_ADD_CLUSTER_CONNECTION = 'DISPLAY_ADD_CLUSTER_CONNECTION';
export function displayAddClusterConnection(display) {
  return {
    type: DISPLAY_ADD_CLUSTER_CONNECTION,
    display: display,
  };
}

export const UPDATE_CLUSTER_CONNECTION = 'UPDATE_CLUSTER_CONNECTION';
export function updateConnection(clusterID, connection) {
  return {
    type: UPDATE_CLUSTER_CONNECTION,
    seeds: connection.seeds,
    name: connection.name,
    clusterID: clusterID,
  };
}

// -----------------------------
// Deleting a cluster connection
export const DELETE_CLUSTER_CONNECTION = 'DELETE_CLUSTER_CONNECTION';
export function deleteClusterConnection(clusterID) {
  return {
    type: DELETE_CLUSTER_CONNECTION,
    clusterID: clusterID,
  };
}

// -------------------------
// Fetch Cluster Connections

export const REQUEST_CLUSTERS = 'REQUEST_CLUSTERS';
function requestClusters() {
  return {
    type: REQUEST_CLUSTERS
  };
}

export const RECEIVE_CLUSTERS = 'RECEIVE_CLUSTERS';
function receiveClusters(clusters = []) {
  return {
    type: RECEIVE_CLUSTERS,
    clusters
  };
}

export function initClusters() {
  return (dispatch) => {
    dispatch(requestClusters());

    listConnections()
      .then((connections) => {
        dispatch(receiveClusters(connections));

        // connect to clusters
        connections.forEach((conn) => {
          if (conn.connected) 
            dispatch(getClusterEntityTree(conn.id));
          else if (conn.connectOnLogin)  // automatically connect to 'clusters without authentication'
            authenticateClusterConnection(conn.id, '', '');
        });

        // show add cluster connection if
        // there are no connections
        if (connections.length === 0) {
          dispatch(selectStartView());
          dispatch(displayAddClusterConnection(true));
          return;
        }

        // select a cluster for overview
        for (let i = 0; i < connections.length; i++) {
          const c = connections[i];
          if (c.connected || c.connectOnLogin) {
            const clusterID = c.id;
            dispatch(selectClusterOnStartup(clusterID));
            return;
          }
        }

      })
      .catch((message) => {
        // TODO 
        console.error('Fetching cluster failed: ' + message);
      });
  }
}

export function fetchClusters() {
  return (dispatch) => {
    dispatch(requestClusters());

    listConnections()
      .then((connections) => {
        dispatch(receiveClusters(connections));

      })
      .catch(() => {
        dispatch(receiveClusters([]))
      });
  }
}

// ---------------------------------------
// Delete entities from cluster

export function deleteUDF(clusterID, udfName) {
  return (dispatch) => {
    dispatch(getClusterEntityTree(clusterID), false);
  };
}

export function deleteIndex(clusterID, namspaceName, setName, indexName) {
  return (dispatch) => {
    dispatch(getClusterEntityTree(clusterID), false);
  };
}

export function deleteSet(clusterID, namespaceName, setName) {
  return (dispatch) => {
    dispatch(getClusterEntityTree(clusterID), false);
  };
}

// ---------------------------------------
// Add new entities to cluster connections

export function addUDF(clusterID, udfName, udfType) {
  return (dispatch) => {
    dispatch(getClusterEntityTree(clusterID), false);
  };
}

// ---------------------------------
// Cluster Connection Updates
export const DISPLAY_VIEW_CLUSTER_CONNECTION = 'DISPLAY_VIEW_CLUSTER_CONNECTION';
export function displayViewClusterConnection(display = true, clusterID = null, isEdit = false) {
  return {
    type: DISPLAY_VIEW_CLUSTER_CONNECTION,
    display: display,
    clusterID: clusterID,
    isEdit: isEdit
  };
}


// ---------------------------------
// Cluster Connection Authentication

export const DISPLAY_AUTH_CLUSTER_CONNECTION = 'DISPLAY_AUTH_CLUSTER_CONNECTION';
export function displayAuthClusterConnection(display, clusterID) {
  return {
    type: DISPLAY_AUTH_CLUSTER_CONNECTION,
    display: display,
    clusterID: clusterID,
  };
}

export const AUTHENTICATING_CLUSTER_CONNECTION = 'AUTHENTICATING_CLUSTER_CONNECTION';
function authenticatingConnection() {
  return {
    type: AUTHENTICATING_CLUSTER_CONNECTION
  };
}

export const AUTHENTICATED_CLUSTER_CONNECTION = 'AUTHENTICATED_CLUSTER_CONNECTION';
function authSuccess(cluster) {
  return {
    type: AUTHENTICATED_CLUSTER_CONNECTION,
    cluster: cluster
  };
}

export const CLUSTER_CONNECTION_AUTH_FAILED = 'CLUSTER_CONNECTION_AUTH_FAILED';
function authFailed(errorMsg) {
  return {
    type: CLUSTER_CONNECTION_AUTH_FAILED,
    errorMsg: errorMsg
  };
}

export const DISCONNECT_CLUSTER_CONNECTION = 'DISCONNECT_CLUSTER_CONNECTION';
export function disconnectCluster(clusterID) {
  return {
    type: DISCONNECT_CLUSTER_CONNECTION,
    clusterID: clusterID
  };
}

export const CLUSTER_CONNECTION_FETCHED = 'CLUSTER_CONNECTION_FETCHED';
function clusterDetails(cluster) {
  return {
    type: CLUSTER_CONNECTION_FETCHED,
    cluster: cluster
  };
}

// expand the cluster tree identified by the cluster id
function expandClusterTree(dispatch, clusterID) {
  const physical = {
    clusterID: clusterID,
    viewType: VIEW_TYPE.CLUSTER
  };
  const logical = {
    clusterID: clusterID,
    viewType: VIEW_TYPE.LOGICAL_CLUSTER
  };

  dispatch(expandEntityNode(physical));
  dispatch(expandEntityNode(logical));
}

// get the cluster entity tree
// WARNING: the cluster needs to be connected
export function getClusterEntityTree(clusterID, expand = true) {
  return (dispatch) => {
    getClusterEntityTreeAPI(clusterID)
      .then((cluster) => {
        dispatch(clusterDetails(cluster));
        
        if (expand)
          expandClusterTree(dispatch, clusterID);
      })
      .catch((error) => {
        // TODO
        console.error('Failed to fetch cluster details for ' + clusterID);
      });
  }
}

export function authenticateClusterConnection(id, name, password) {
  return (dispatch) => {
    authConnectionAPI(id, name, password)
      .then((cluster) => {
        dispatch(authSuccess(cluster));

        // expand the cluster on authentication
        expandClusterTree(dispatch, cluster.id);

        // select cluster overview
        dispatch(selectCluster(id, CLUSTER_ACTIONS.Overview));
      })
      .catch((message) => {
        message = message || 'Failed to authenticate';
        dispatch(authFailed(message));
      })
  }
}
