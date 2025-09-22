

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createSurvey, deleteSurvey, updateSurvey, getSurvey } from "../api/surveys.api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Trash2, Save, Plus } from "lucide-react";


export function SurveysFormPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const params = useParams();

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (params.id) {
        await updateSurvey(params.id, data);
        toast.success("Survey updated successfully");
      } else {
        await createSurvey(data);
        toast.success("Survey created successfully");
      }
      navigate("/surveys");
    } catch (error) {
      toast.error("An error occurred while saving the survey");
    }
  });

  useEffect(() => {
    async function loadSurvey() {
      if (params.id) {
        const { data } = await getSurvey(params.id);
        setValue("title", data.title);
        setValue("description", data.description);
      }
    }
    loadSurvey();
  }, [params.id, setValue]);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">
        {params.id ? "Edit Survey" : "Create New Survey"}
      </h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            placeholder="Title"
            {...register("title", { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.title && <span className="text-red-500 text-sm">Title is required</span>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            placeholder="Description"
            {...register("description", { required: true })}
            rows={5}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
          {errors.description && <span className="text-red-500 text-sm">Description is required</span>}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          {params.id && (
            <button
              type="button"
              onClick={async () => {
                const accepted = window.confirm("Are you sure you want to delete it?");
                if (accepted) {
                  await deleteSurvey(params.id);
                  navigate("/surveys");
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Save className="mr-2 h-4 w-4" />
            {params.id ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
