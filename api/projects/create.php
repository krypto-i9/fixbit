<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

/*  This file is used for create project API calls, 
    Method   : POST
    request  : uid, name, description and token are required
    response : Success or Error
*/

include_once "../config/db.php";
include_once "../users/token_validation.php";
include_once "./project.php";
include_once "../op_support/op_support.php";

$_db = new Database();
$db = $_db->connect();

$token = new Token();
$project = new Project($db);
$op_support = new OpSupport($db);


$data = json_decode(file_get_contents('php://input'));

if (
    !empty($data->uid) &&
    !empty($data->token) &&
    !empty($data->name) &&
    !empty($data->description) &&
    $token->validJWT($data->uid, $data->token)
) {
    $project->setName($data->name);
    $project->setDescription($data->description);
    $project->setCreatorId($data->uid);
    $project->setAdminId($data->uid);
    $project->setTeamId(null);

    $isPublic = $data->isPublic === 0 ? 0 : 1;
    $project->setIsPublic($isPublic);

    if ($project->projectNameOk($data->name)) {
        if ($project->create()) {
            if ($project->getProjectByName($data->name)) {
                http_response_code(200);
                $project_data = array(
                    "pid" => $project->getId(),
                    "name" => $project->getName(),
                    "description" => $project->getDescription(),
                    "creatorId" => $project->getCreatorId(),
                    "adminId" => $project->getAdminId(),
                    "isPublic" => $project->getIsPublic()
                );
                if ($op_support->addToProjectUserSearchSupport($data->uid, $project->getId(), 1, $project->getIsPublic()) && $project->createTableForProject($project->getId())) {
                    echo json_encode(array("success" => true, "msg" => "Project Created Successfully", "project_data" => $project_data, "type" => "success"));
                } else {
                    http_response_code(200);
                    $project->deleteProjectById($project->getId());
                    echo json_encode(array("success" => false, "msg" => "Something Went Wrong, Please Try again.", "project_data" => null, "type" => "error"));
                }
            } else {
                http_response_code(200);
                echo json_encode(array("success" => false, "msg" => "Project Data Fetch Failed", "project_data" => null, "type" => "error"));
            }
        } else {
            http_response_code(200);
            echo json_encode(array("success" => false, "msg" => "Project Creation Failed", "project_data" => null, "type" => "error"));
        }
    } else {
        http_response_code(200);
        echo json_encode(array("success" => false, "msg" => "Project Name Already in Use. Please Use Another", "project_data" => null, "type" => "error"));
    }
} else {
    http_response_code(200);
    echo json_encode(array("success" => false, "msg" => "Unauthorized"));
}
